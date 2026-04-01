import type { H3Event } from 'h3'
import { getServerConfig, verifyAuth, createAuthError, forwardStream } from '../../utils/auth'

const DEEPSEEK_OFFICIAL = 'https://api.deepseek.com'

export default defineEventHandler(async (event: H3Event) => {
  const config = getServerConfig()
  const path = getRouterParam(event, 'path') || ''
  const method = event.method

  let body: any
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    body = await readBody(event)
  }

  // 鉴权（NuxtChat 访问密码，无密码时放行）
  const authHeader = getHeader(event, 'authorization') || ''
  const userApiKey = authHeader.replace('Bearer ', '').trim()
  const accessCode = body?.accessCode || getHeader(event, 'x-access-code') || ''
  if (!verifyAuth(event, accessCode, userApiKey)) {
    throw createAuthError()
  }

  // API Key：服务端环境变量 > 用户自带
  const apiKey = config.deepseekApiKey || userApiKey
  if (!apiKey) {
    throw createError({ statusCode: 401, statusMessage: 'No DeepSeek API key provided' })
  }

  // 去除内部字段，剩余转发给 DeepSeek
  const { accessCode: _a, openaiUrl: _b, deepseekUrl: _c, ...forwardBody } = body || {}
  const isStream = forwardBody?.stream === true

  // ── 第一优先：官方 DeepSeek API ───────────────────────────────────────────
  try {
    const targetUrl = `${DEEPSEEK_OFFICIAL}/v1/${path}`
    const upstream = await fetch(targetUrl, {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: method !== 'GET' ? JSON.stringify(forwardBody) : undefined,
    })

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => upstream.statusText)
      // 4xx 错误（Key 无效等）直接抛出，不再 fallback
      if (upstream.status >= 400 && upstream.status < 500) {
        throw createError({ statusCode: upstream.status, statusMessage: errText })
      }
      // 5xx / 网络抖动：记录后 fallback
      console.warn(`[deepseek] official API ${upstream.status}, trying fallback`)
      throw new Error(`upstream ${upstream.status}`)
    }

    if (isStream) return forwardStream(event, upstream)
    return upstream.json()
  }
  catch (e: any) {
    // createError 抛出的 H3Error 直接向上抛（不 fallback）
    if (e.statusCode) throw e
    // 网络错误或 5xx：降级到用户配置的自定义地址
    console.warn('[deepseek] falling back to custom URL:', e.message)
  }

  // ── Fallback：用户配置的自定义兼容地址 ────────────────────────────────────
  const customBase: string = body?.deepseekUrl || body?.openaiUrl || DEEPSEEK_OFFICIAL
  const base = customBase.replace(/\/$/, '')
  const hasVersion = /\/v\d+/.test(new URL(base, 'http://x').pathname)
  const fallbackUrl = hasVersion ? `${base}/${path}` : `${base}/v1/${path}`

  const fallback = await fetch(fallbackUrl, {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: method !== 'GET' ? JSON.stringify(forwardBody) : undefined,
  }).catch((e) => {
    throw createError({ statusCode: 502, statusMessage: `DeepSeek fallback error: ${e.message}` })
  })

  if (!fallback.ok) {
    const errText = await fallback.text().catch(() => fallback.statusText)
    throw createError({ statusCode: fallback.status, statusMessage: errText })
  }

  if (isStream) return forwardStream(event, fallback)
  return fallback.json()
})
