import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // 纯客户端渲染：聊天数据全部存在 IndexedDB，SSR 只会产生水合不匹配
  ssr: false,

  app: {
    head: {
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      meta: [
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      ],
    },
  },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@vueuse/nuxt',
  ],

  // Auto-import all components by filename only (ignore subdirectory prefix)
  components: [
    { path: '~/components', pathPrefix: false },
  ],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  i18n: {
    locales: [
      { code: 'zh', name: '中文', file: 'zh.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    defaultLocale: 'zh',
    langDir: 'locales/',
    strategy: 'no_prefix',
  },

  runtimeConfig: {
    // Server-only secrets (API keys)
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    googleApiKey: process.env.GOOGLE_API_KEY || '',
    deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
    azureApiKey: process.env.AZURE_API_KEY || '',
    azureBaseUrl: process.env.AZURE_BASE_URL || '',
    accessCode: process.env.CODE || '',
    // Public config (accessible in browser)
    public: {
      appVersion: '1.0.0',
      enableMcp: process.env.ENABLE_MCP === 'true',
    },
  },

  nitro: {
    routeRules: {
      '/api/**': { cors: true },
    },
  },
})
