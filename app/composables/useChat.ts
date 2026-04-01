import { useChatStore } from '~/stores/chat'
import { useAccessStore } from '~/stores/access'
import { useConfigStore } from '~/stores/config'
import { useMcpStore } from '~/stores/mcp'
import { parseSSELine } from '~/utils/common'
import type { ChatMessage } from '~/utils/types'

/** 累积的工具调用（SSE delta 是分片的，需要按 index 拼接） */
interface ToolCallAcc {
  id: string
  name: string
  arguments: string
}

export function useChat() {
  const chatStore = useChatStore()
  const accessStore = useAccessStore()
  const configStore = useConfigStore()
  const mcpStore = useMcpStore()

  const isGenerating = ref(false)
  let abortController: AbortController | null = null

  async function sendMessage(content: string, sessionId?: string) {
    const sid = sessionId || chatStore.currentSessionId
    if (!sid || isGenerating.value || !content.trim()) return

    isGenerating.value = true
    chatStore.isGenerating = true
    abortController = new AbortController()

    const userMsg = chatStore.createUserMessage(content)
    chatStore.addMessage(sid, userMsg)
    const assistantMsg = chatStore.createAssistantMessage()
    chatStore.addMessage(sid, assistantMsg)

    try {
      const session = chatStore.sessions.find(s => s.id === sid)
      if (!session) throw new Error('Session not found')

      const modelConfig = session.mask.modelConfig
      const provider = modelConfig.providerName || configStore.currentProvider
      const model = modelConfig.model || configStore.currentModel
      const historyCount = modelConfig.historyMessageCount ?? 10
      const history = session.messages
        .slice(0, -1)
        .filter(m => !m.isError && !m.streaming)
        .slice(-historyCount)

      let messages: any[] = [
        ...session.mask.context.map(m => ({ role: m.role, content: m.content })),
        ...history.map(m => ({ role: m.role, content: m.content })),
      ]

      const endpoint = getEndpoint(provider!)
      const headers = buildHeaders(provider!, accessStore)
      const baseBody = {
        model,
        stream: true,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.max_tokens,
        ...getProviderBody(provider!, accessStore),
      }

      // MCP 工具（只对 OpenAI 兼容 provider 注入，Anthropic/Google 格式不同）
      const supportsTools = !['Anthropic', 'Google'].includes(provider!)
      const mcpTools = supportsTools && mcpStore.isEnabled ? mcpStore.openAITools : []

      // ── 工具调用循环 ─────────────────────────────────────────
      let finalText = ''
      let continueLoop = true

      while (continueLoop) {
        const reqBody = {
          ...baseBody,
          messages,
          ...(mcpTools.length ? { tools: mcpTools, tool_choice: 'auto' } : {}),
        }

        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(reqBody),
          signal: abortController!.signal,
        })

        if (!resp.ok) throw new Error(`API Error ${resp.status}: ${await resp.text()}`)

        let chunkText = ''
        const toolCallsMap: Record<number, ToolCallAcc> = {}
        let finishReason = ''
        const reader = resp.body?.getReader()
        if (!reader) throw new Error('No response body')
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          for (const line of decoder.decode(value, { stream: true }).split('\n')) {
            const data = parseSSELine(line.trim())
            if (!data) continue
            try {
              const choice = JSON.parse(data).choices?.[0]
              if (!choice) continue
              // 累积文字
              if (choice.delta?.content) {
                chunkText += choice.delta.content
                chatStore.appendStreamContent(sid, chunkText)
              }
              // 累积工具调用 delta（按 index 拼接）
              for (const tc of choice.delta?.tool_calls ?? []) {
                const i = tc.index ?? 0
                if (!toolCallsMap[i]) toolCallsMap[i] = { id: '', name: '', arguments: '' }
                if (tc.id) toolCallsMap[i].id = tc.id
                if (tc.function?.name) toolCallsMap[i].name += tc.function.name
                if (tc.function?.arguments) toolCallsMap[i].arguments += tc.function.arguments
              }
              if (choice.finish_reason) finishReason = choice.finish_reason
            } catch {}
          }
        }

        const toolCalls = Object.values(toolCallsMap)
        if (finishReason === 'tool_calls' && toolCalls.length > 0) {
          // 显示"调用中"状态
          chatStore.appendStreamContent(sid, `🔧 调用工具：${toolCalls.map(t => t.name).join('、')}…`)

          // 并行执行所有工具
          const results = await Promise.all(toolCalls.map(tc => runTool(tc, mcpStore)))

          // 执行完毕后更新状态行，附带引擎 / 结果条数等信息
          const statusLines = results.map((r, i) => {
            const name = toolCalls[i].name
            if (name === 'web_search') {
              // 从结果头部提取引擎名："> 🔍 搜索引擎：**Tavily**　共 N 条结果"
              const m = r.content.match(/搜索引擎：\*\*([^*]+)\*\*.*?(\d+)\s*条/)
              return m ? `🔍 web_search · ${m[1]} · ${m[2]} 条结果 ✓` : `🔧 ${name} ✓`
            }
            return `🔧 ${name} ✓`
          })
          chatStore.appendStreamContent(sid, statusLines.join('\n'))

          // 将 tool_calls + tool 结果追加到消息链，进入下一轮
          messages = [
            ...messages,
            {
              role: 'assistant',
              content: null,
              tool_calls: toolCalls.map(tc => ({
                id: tc.id, type: 'function',
                function: { name: tc.name, arguments: tc.arguments },
              })),
            },
            ...results.map(r => ({ role: 'tool', tool_call_id: r.id, content: r.content })),
          ]
        }
        else {
          finalText = chunkText
          continueLoop = false
        }
      }

      await chatStore.updateLastMessage(sid, (msg: ChatMessage) => {
        msg.content = finalText || '(空响应)'
        msg.streaming = false
      })

      if (session.messages.length <= 3 && configStore.autoGenerateTitle)
        generateTitle(sid, content)
    }
    catch (e: any) {
      if (e.name === 'AbortError') {
        await chatStore.updateLastMessage(sid, (msg: ChatMessage) => { msg.streaming = false })
      }
      else {
        await chatStore.updateLastMessage(sid, (msg: ChatMessage) => {
          msg.content = `❌ ${e.message}`
          msg.isError = true
          msg.streaming = false
        })
      }
    }
    finally {
      isGenerating.value = false
      chatStore.isGenerating = false
      abortController = null
    }
  }

  async function generateTitle(sessionId: string, firstMessage: string) {
    try {
      const session = chatStore.sessions.find(s => s.id === sessionId)
      if (!session || session.topic !== '新的对话') return
      const provider = session.mask.modelConfig.providerName || configStore.currentProvider
      const endpoint = getEndpoint(provider!)
      const headers = buildHeaders(provider!, accessStore)
      const body = {
        model: session.mask.modelConfig.model || configStore.currentModel,
        messages: [
          { role: 'user', content: `请用5个字以内总结以下内容作为对话标题，只输出标题文字：\n${firstMessage}` },
        ],
        max_tokens: 20,
        stream: false,
        ...getProviderBody(provider!, accessStore),
      }
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      })
      if (!resp.ok) return
      const data = await resp.json()
      const title = data.choices?.[0]?.message?.content?.trim()
      if (title) chatStore.renameSession(sessionId, title)
    } catch {}
  }

  function stopGenerating() {
    abortController?.abort()
  }

  return { sendMessage, stopGenerating, isGenerating }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** 执行单个工具调用，返回结果文本 */
async function runTool(tc: ToolCallAcc, mcpStore: ReturnType<typeof useMcpStore>): Promise<{ id: string; content: string }> {
  const tool = mcpStore.tools.find(t => t.name === tc.name)
  const server = tool ? mcpStore.servers.find(s => s.id === tool.serverId && s.enabled) : null
  if (!server) return { id: tc.id, content: `工具 "${tc.name}" 不可用` }
  try {
    const args = JSON.parse(tc.arguments || '{}')
    const resp = await $fetch<any>(server.url, {
      method: 'POST',
      body: { jsonrpc: '2.0', method: 'tools/call', params: { name: tc.name, arguments: args }, id: Date.now() },
    })
    const text = (resp?.result?.content ?? []).map((c: any) => c.text).join('\n')
    return { id: tc.id, content: text || '（无返回内容）' }
  }
  catch (e: any) {
    return { id: tc.id, content: `工具执行失败：${e.message}` }
  }
}

/**
 * 所有 OpenAI 兼容协议的 Provider 统一走 /api/openai/ 代理，
 * 通过 body.openaiUrl 告知代理实际转发目标，无需为每家建单独路由。
 */
function getEndpoint(provider: string): string {
  if (provider === 'Anthropic') return '/api/anthropic/v1/messages'
  if (provider === 'Google')    return '/api/google/models'
  if (provider === 'Ollama')    return '/api/ollama/v1/chat/completions'
  // DeepSeek 有专属代理：优先官方 API，失败降级自定义地址
  if (provider === 'DeepSeek')  return '/api/deepseek/chat/completions'
  return '/api/openai/chat/completions'
}

function buildHeaders(provider: string, access: any): Record<string, string> {
  if (provider === 'Ollama')    return {}
  if (provider === 'Anthropic') return { 'x-api-key': access.apiKeyForProvider(provider) }
  const apiKey = access.apiKeyForProvider(provider)
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
}

function getProviderBody(provider: string, access: any): Record<string, unknown> {
  if (provider === 'Ollama') {
    return { ollamaUrl: access.ollamaUrl || 'http://localhost:11434' }
  }
  if (provider === 'DeepSeek') {
    // 把用户配置的自定义地址传给专属代理，用于 fallback
    const customUrl = access.baseUrlForProvider('DeepSeek')
    return {
      accessCode: access.accessCode,
      ...(customUrl ? { deepseekUrl: customUrl } : {}),
    }
  }
  // 其余 OpenAI 兼容 Provider：通过 openaiUrl 告知通用代理目标地址
  const baseUrl: string = access.baseUrlForProvider(provider) || ''
  return {
    accessCode: access.accessCode,
    ...(baseUrl && provider !== 'OpenAI' ? { openaiUrl: baseUrl } : {}),
  }
}
