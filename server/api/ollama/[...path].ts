import type { H3Event } from 'h3'

/**
 * Ollama 代理
 * Ollama 运行在本地，无需 API Key，直接转发请求。
 * 支持流式和非流式响应。
 */
export default defineEventHandler(async (event: H3Event) => {
  const path = getRouterParam(event, 'path') || ''
  const method = event.method

  let body: any
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    body = await readBody(event)
  }

  // 从请求体或 header 中读取 ollamaUrl，默认本机
  const ollamaUrl = (body?.ollamaUrl as string | undefined)
    || getHeader(event, 'x-ollama-url')
    || 'http://localhost:11434'

  // 去掉内部字段，避免转发给 Ollama
  const { ollamaUrl: _ou, accessCode: _ac, ...forwardBody } = body || {}

  const targetUrl = `${ollamaUrl.replace(/\/$/, '')}/${path}`

  const upstream = await fetch(targetUrl, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method !== 'GET' ? JSON.stringify(forwardBody) : undefined,
  }).catch((e) => {
    throw createError({
      statusCode: 502,
      statusMessage: `无法连接到 Ollama（${ollamaUrl}）：${e.message}`,
    })
  })

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => upstream.statusText)
    throw createError({ statusCode: upstream.status, statusMessage: errText })
  }

  const isStream = forwardBody?.stream === true

  if (isStream) {
    setResponseHeader(event, 'Content-Type', 'text/event-stream')
    setResponseHeader(event, 'Cache-Control', 'no-cache')
    setResponseHeader(event, 'Connection', 'keep-alive')

    const res = event.node.res
    const reader = upstream.body?.getReader()
    if (!reader) { res.end(); return }
    const decoder = new TextDecoder()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(decoder.decode(value, { stream: true }))
      }
    } catch {}
    res.end()
    return
  }

  return upstream.json()
})
