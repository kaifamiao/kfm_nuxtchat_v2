import { defineStore } from 'pinia'
import { db, DB_KEYS } from '~/utils/db'
import type { AccessConfig, ModelProvider } from '~/utils/types'

const DEFAULT_ACCESS: AccessConfig = {
  accessCode: '',
  useCustomConfig: false,
  provider: 'OpenAI',
  openaiUrl: 'https://api.openai.com',
  openaiApiKey: '',
  anthropicUrl: 'https://api.anthropic.com',
  anthropicApiKey: '',
  anthropicApiVersion: '2023-06-01',
  googleUrl: 'https://generativelanguage.googleapis.com',
  googleApiKey: '',
  googleApiVersion: 'v1beta',
  azureUrl: '',
  azureApiKey: '',
  azureApiVersion: '2024-02-01',
  deepseekUrl: 'https://api.deepseek.com',
  deepseekApiKey: '',
  moonshotUrl: 'https://api.moonshot.cn',
  moonshotApiKey: '',
  alibabaUrl: 'https://dashscope.aliyuncs.com',
  alibabaApiKey: '',
  xaiApiKey: '',
  xaiUrl: 'https://api.x.ai',
  siliconflowUrl: 'https://api.siliconflow.cn',
  siliconflowApiKey: '',
  chatglmUrl: 'https://open.bigmodel.cn',
  chatglmApiKey: '',
  bytedanceUrl: 'https://ark.cn-beijing.volces.com',
  bytedanceApiKey: '',
  baiduUrl: 'https://aip.baidubce.com',
  baiduApiKey: '',
}

export const useAccessStore = defineStore('access', {
  state: (): AccessConfig => ({ ...DEFAULT_ACCESS }),

  getters: {
    isAuthorized: (state) => {
      // Has access code or has custom API key
      return !!(state.accessCode || state.openaiApiKey || state.anthropicApiKey)
    },

    apiKeyForProvider: (state) => (provider: ModelProvider) => {
      const map: Record<string, string> = {
        OpenAI: state.openaiApiKey,
        Anthropic: state.anthropicApiKey,
        Google: state.googleApiKey,
        Azure: state.azureApiKey,
        DeepSeek: state.deepseekApiKey,
        Moonshot: state.moonshotApiKey,
        Alibaba: state.alibabaApiKey,
        XAI: state.xaiApiKey,
        SiliconFlow: state.siliconflowApiKey,
        ChatGLM: state.chatglmApiKey,
        ByteDance: state.bytedanceApiKey,
        Baidu: state.baiduApiKey,
      }
      return map[provider] || ''
    },

    baseUrlForProvider: (state) => (provider: ModelProvider) => {
      const map: Record<string, string> = {
        OpenAI: state.openaiUrl,
        Anthropic: state.anthropicUrl,
        Google: state.googleUrl,
        Azure: state.azureUrl,
        DeepSeek: state.deepseekUrl,
        Moonshot: state.moonshotUrl,
        Alibaba: state.alibabaUrl,
        XAI: state.xaiUrl,
        SiliconFlow: state.siliconflowUrl,
        ChatGLM: state.chatglmUrl,
        ByteDance: state.bytedanceUrl,
        Baidu: state.baiduUrl,
      }
      return map[provider] || ''
    },
  },

  actions: {
    async load() {
      const saved = await db.get<AccessConfig>(DB_KEYS.ACCESS_STORE)
      if (saved) this.$patch(saved)
    },

    async save() {
      await db.set(DB_KEYS.ACCESS_STORE, this.$state)
    },

    update(config: Partial<AccessConfig>) {
      this.$patch(config)
      this.save()
    },

    setProvider(provider: ModelProvider) {
      this.provider = provider
      this.save()
    },

    reset() {
      this.$patch(DEFAULT_ACCESS)
      this.save()
    },
  },
})
