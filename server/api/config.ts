/**
 * 公开配置接口（不包含敏感 Key）
 * 客户端通过此接口获取服务端启用的功能
 */
export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  return {
    needCode: !!config.accessCode,
    hideUserApiKey: process.env.HIDE_USER_API_KEY === '1',
    disableGPT4: process.env.DISABLE_GPT4 === '1',
    enableMcp: config.public.enableMcp,
    version: config.public.appVersion,
    // Which providers are pre-configured server-side
    providers: {
      openai: !!config.openaiApiKey,
      anthropic: !!config.anthropicApiKey,
      google: !!config.googleApiKey,
      deepseek: !!config.deepseekApiKey,
    },
  }
})
