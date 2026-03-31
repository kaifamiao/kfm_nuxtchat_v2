import type { H3Event } from 'h3'
import { getServerConfig, verifyAuth, createAuthError } from '../../utils/auth'

export default defineEventHandler(async (event: H3Event) => {
  const config = getServerConfig()
  const path = getRouterParam(event, 'path') || ''
  const method = event.method
  const query = getQuery(event)

  let body: any
  if (['POST', 'PUT'].includes(method)) body = await readBody(event)

  const accessCode = body?.accessCode || getHeader(event, 'x-access-code') || ''
  const userApiKey = (query.key as string) || body?.googleApiKey || ''

  if (!verifyAuth(event, accessCode, userApiKey)) throw createAuthError()

  const apiKey = config.googleApiKey || userApiKey
  if (!apiKey) throw createError({ statusCode: 401, statusMessage: 'No Google API key' })

  const baseUrl = body?.googleUrl || 'https://generativelanguage.googleapis.com'
  const apiVersion = body?.googleApiVersion || 'v1beta'
  const targetUrl = `${baseUrl.replace(/\/$/, '')}/${apiVersion}/${path}?key=${apiKey}`

  const { accessCode: _, googleApiKey: __, googleUrl: ___, googleApiVersion: ____, ...forwardBody } = body || {}
  const isStream = path.includes('streamGenerateContent') || forwardBody?.stream === true

  const upstream = await fetch(targetUrl, {
    method,
    headers: { 'Content-Type': 'application/json' },
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
