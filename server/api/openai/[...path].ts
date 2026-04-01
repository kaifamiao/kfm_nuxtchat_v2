import type { H3Event } from 'h3'
import { getServerConfig, verifyAuth, createAuthError } from '../../utils/auth'

export default defineEventHandler(async (event: H3Event) => {
  const config = getServerConfig()
  const path = getRouterParam(event, 'path') || ''
  const method = event.method

  // Read request body
  let body: any
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    body = await readBody(event)
  }

  // Auth check
  const authHeader = getHeader(event, 'authorization') || ''
  const userApiKey = authHeader.replace('Bearer ', '').trim()
  const accessCode = body?.accessCode || getHeader(event, 'x-access-code') || ''

  if (!verifyAuth(event, accessCode, userApiKey)) {
    throw createAuthError()
  }

  // Choose API key: server-side key takes priority
  const apiKey = config.openaiApiKey || userApiKey
  if (!apiKey) throw createError({ statusCode: 401, statusMessage: 'No API key provided' })

  // Build upstream URL
  // 如果 baseUrl 路径中已含版本号（如 /v3、/v4），则直接拼路径，不再插入 /v1/
  const baseUrl = body?.openaiUrl || config.openaiBaseUrl || 'https://api.openai.com'
  const base = baseUrl.replace(/\/$/, '')
  const hasVersionSegment = /\/v\d+/.test(new URL(base, 'http://x').pathname)
  const targetUrl = hasVersionSegment ? `${base}/${path}` : `${base}/v1/${path}`

  // Build forward headers
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }

  // Strip internal fields from body
  const { accessCode: _, openaiUrl: __, ...forwardBody } = body || {}

  const isStream = forwardBody?.stream === true

  const upstream = await fetch(targetUrl, {
    method,
    headers,
    body: body ? JSON.stringify(forwardBody) : undefined,
  })

  if (!upstream.ok) {
    const errorBody = await upstream.text()
    throw createError({ statusCode: upstream.status, statusMessage: errorBody })
  }

  if (isStream) {
    // Stream back SSE
    setResponseHeader(event, 'Content-Type', 'text/event-stream')
    setResponseHeader(event, 'Cache-Control', 'no-cache')
    setResponseHeader(event, 'Connection', 'keep-alive')
    setResponseHeader(event, 'Transfer-Encoding', 'chunked')

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
