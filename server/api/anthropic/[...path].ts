import type { H3Event } from 'h3'
import { getServerConfig, verifyAuth, createAuthError } from '../../utils/auth'

export default defineEventHandler(async (event: H3Event) => {
  const config = getServerConfig()
  const path = getRouterParam(event, 'path') || ''
  const method = event.method

  let body: any
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    body = await readBody(event)
  }

  const authHeader = getHeader(event, 'x-api-key') || ''
  const userApiKey = authHeader.trim()
  const accessCode = body?.accessCode || getHeader(event, 'x-access-code') || ''

  if (!verifyAuth(event, accessCode, userApiKey)) throw createAuthError()

  const apiKey = config.anthropicApiKey || userApiKey
  if (!apiKey) throw createError({ statusCode: 401, statusMessage: 'No Anthropic API key' })

  const baseUrl = body?.anthropicUrl || 'https://api.anthropic.com'
  const targetUrl = `${baseUrl.replace(/\/$/, '')}/${path}`

  const apiVersion = body?.anthropicVersion || '2023-06-01'
  const headers: Record<string, string> = {
    'x-api-key': apiKey,
    'anthropic-version': apiVersion,
    'Content-Type': 'application/json',
  }

  const { accessCode: _, anthropicUrl: __, anthropicVersion: ___, ...forwardBody } = body || {}
  const isStream = forwardBody?.stream === true

  const upstream = await fetch(targetUrl, {
    method,
    headers,
    body: body ? JSON.stringify(forwardBody) : undefined,
  })

  if (isStream) {
    setResponseHeader(event, 'Content-Type', 'text/event-stream')
    setResponseHeader(event, 'Cache-Control', 'no-cache')
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

  if (!upstream.ok) {
    const err = await upstream.text()
    throw createError({ statusCode: upstream.status, statusMessage: err })
  }
  return upstream.json()
})
