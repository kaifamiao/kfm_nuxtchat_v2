import type { H3Event } from 'h3'

export function getServerConfig() {
  const config = useRuntimeConfig()
  return {
    openaiApiKey: config.openaiApiKey as string,
    openaiBaseUrl: (config.openaiBaseUrl as string) || 'https://api.openai.com',
    anthropicApiKey: config.anthropicApiKey as string,
    googleApiKey: config.googleApiKey as string,
    deepseekApiKey: config.deepseekApiKey as string,
    azureApiKey: config.azureApiKey as string,
    azureBaseUrl: config.azureBaseUrl as string,
    accessCode: config.accessCode as string,
  }
}

export function verifyAuth(event: H3Event, userAccessCode?: string, userApiKey?: string): boolean {
  const cfg = getServerConfig()
  // No access code set → open access
  if (!cfg.accessCode) return true
  // Check user-provided code
  if (userAccessCode) {
    const validCodes = cfg.accessCode.split(',').map(c => c.trim())
    if (validCodes.includes(userAccessCode)) return true
  }
  // Check user-provided API key (allowed if server has no key configured)
  if (userApiKey && !cfg.openaiApiKey) return true
  return false
}

export function getApiKey(event: H3Event, userKey?: string): string {
  const cfg = getServerConfig()
  // Server key takes priority
  return cfg.openaiApiKey || userKey || ''
}

export function createAuthError() {
  return createError({ statusCode: 401, statusMessage: 'Unauthorized: Invalid access code or API key' })
}

/** Forward streaming response */
export async function forwardStream(event: H3Event, upstreamResponse: Response): Promise<void> {
  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Connection', 'keep-alive')

  const writer = event.node.res
  const reader = upstreamResponse.body?.getReader()
  if (!reader) { writer.end(); return }

  const decoder = new TextDecoder()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      writer.write(decoder.decode(value, { stream: true }))
    }
  } finally {
    writer.end()
  }
}
