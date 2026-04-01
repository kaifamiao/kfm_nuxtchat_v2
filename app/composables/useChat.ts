import { useChatStore } from '~/stores/chat'
import { useAccessStore } from '~/stores/access'
import { useConfigStore } from '~/stores/config'
import { parseSSELine } from '~/utils/common'
import type { ChatMessage } from '~/utils/types'

export function useChat() {
  const chatStore = useChatStore()
  const accessStore = useAccessStore()
  const configStore = useConfigStore()

  const isGenerating = ref(false)
  let abortController: AbortController | null = null

  async function sendMessage(content: string, sessionId?: string) {
    const sid = sessionId || chatStore.currentSessionId
    if (!sid || isGenerating.value || !content.trim()) return

    isGenerating.value = true
    chatStore.isGenerating = true
    abortController = new AbortController()

    // Add user message
    const userMsg = chatStore.createUserMessage(content)
    chatStore.addMessage(sid, userMsg)

    // Add placeholder assistant message
    const assistantMsg = chatStore.createAssistantMessage()
    chatStore.addMessage(sid, assistantMsg)

    try {
      const session = chatStore.sessions.find(s => s.id === sid)
      if (!session) throw new Error('Session not found')

      const modelConfig = session.mask.modelConfig
      const provider = modelConfig.providerName || configStore.currentProvider
      const model = modelConfig.model || configStore.currentModel

      // Build messages array (history + new user msg)
      const historyCount = modelConfig.historyMessageCount ?? 10
      const history = session.messages
        .slice(0, -1) // exclude the placeholder
        .filter(m => !m.isError && !m.streaming)
        .slice(-historyCount)

      const messages = [
        ...session.mask.context.map(m => ({ role: m.role, content: m.content })),
        ...history.map(m => ({ role: m.role, content: m.content })),
      ]

      // Choose endpoint by provider
      const endpoint = getEndpoint(provider!)
      const headers = buildHeaders(provider!, accessStore)

      const body = {
        model,
        messages,
        stream: true,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.max_tokens,
        ...getProviderBody(provider!, accessStore),
      }

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
        signal: abortController.signal,
      })

      if (!resp.ok) {
        const err = await resp.text()
        throw new Error(`API Error ${resp.status}: ${err}`)
      }

      // Stream parse（只更新内存，不写 IDB）
      let fullText = ''
      const reader = resp.body?.getReader()
      if (!reader) throw new Error('No response body')
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        for (const line of lines) {
          const data = parseSSELine(line.trim())
          if (!data) continue
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content || ''
            if (delta) {
              fullText += delta
              // 仅更新内存，不触发 IDB 写入
              chatStore.appendStreamContent(sid, fullText)
            }
          } catch {}
        }
      }

      // 流式结束：一次性持久化最终状态
      await chatStore.updateLastMessage(sid, (msg: ChatMessage) => {
        msg.content = fullText || '(空响应)'
        msg.streaming = false
      })

      // Auto-generate title for new sessions
      if (session.messages.length <= 3 && configStore.autoGenerateTitle) {
        generateTitle(sid, content)
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        await chatStore.updateLastMessage(sid, (msg: ChatMessage) => {
          msg.streaming = false
        })
      } else {
        await chatStore.updateLastMessage(sid, (msg: ChatMessage) => {
          msg.content = `❌ ${e.message}`
          msg.isError = true
          msg.streaming = false
        })
      }
    } finally {
      isGenerating.value = false
      chatStore.isGenerating = false
      abortController = null
    }
  }

  function stopGenerating() {
    abortController?.abort()
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

  return { sendMessage, stopGenerating, isGenerating }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
