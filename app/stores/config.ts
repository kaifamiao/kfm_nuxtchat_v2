import { defineStore } from 'pinia'
import { db, DB_KEYS } from '~/utils/db'
import type { ModelConfig, ModelProvider, ThemeMode } from '~/utils/types'
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from '~/utils/models'

export interface AppConfig {
  // Model config
  modelConfig: ModelConfig
  // UI
  theme: ThemeMode
  language: string
  fontSize: number
  sidebarWidth: number
  // Behavior
  sendKey: 'Enter' | 'Shift+Enter'
  autoGenerateTitle: boolean
  // TTS
  ttsConfig: {
    enable: boolean
    engine: 'browser' | 'openai'
    voice: string
    speed: number
  }
  // Lucide icon name used as default avatar
  defaultAvatar: string
}

const DEFAULT_MODEL_CONFIG: ModelConfig = {
  model: DEFAULT_MODEL,
  providerName: DEFAULT_PROVIDER,
  temperature: 0.5,
  top_p: 1,
  max_tokens: 4096,
  presence_penalty: 0,
  frequency_penalty: 0,
  sendMemory: true,
  historyMessageCount: 10,
  compressMessageLengthThreshold: 4000,
  enableInjectSystemPrompts: true,
  stream: true,
}

const DEFAULT_CONFIG: AppConfig = {
  modelConfig: DEFAULT_MODEL_CONFIG,
  theme: 'auto',
  language: 'zh',
  fontSize: 14,
  sidebarWidth: 260,
  sendKey: 'Enter',
  autoGenerateTitle: true,
  ttsConfig: {
    enable: false,
    engine: 'browser',
    voice: '',
    speed: 1.0,
  },
  defaultAvatar: 'Bot',
}

export const useConfigStore = defineStore('config', {
  state: (): AppConfig => ({ ...DEFAULT_CONFIG }),

  getters: {
    currentModel: (state) => state.modelConfig.model,
    currentProvider: (state) => state.modelConfig.providerName as ModelProvider,
    isDark: (state) => {
      if (state.theme === 'dark') return true
      if (state.theme === 'light') return false
      if (import.meta.client) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      return false
    },
  },

  actions: {
    async load() {
      const saved = await db.get<AppConfig>(DB_KEYS.CONFIG_STORE)
      if (saved) this.$patch(saved)
    },

    async save() {
      await db.set(DB_KEYS.CONFIG_STORE, this.$state)
    },

    updateModelConfig(config: Partial<ModelConfig>) {
      this.modelConfig = { ...this.modelConfig, ...config }
      this.save()
    },

    setModel(model: string, provider?: ModelProvider) {
      this.modelConfig.model = model
      if (provider) this.modelConfig.providerName = provider
      this.save()
    },

    setTheme(theme: ThemeMode) {
      this.theme = theme
      this.save()
      if (import.meta.client) {
        const root = document.documentElement
        if (theme === 'dark') root.setAttribute('data-theme', 'dark')
        else if (theme === 'light') root.removeAttribute('data-theme')
        else {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          isDark ? root.setAttribute('data-theme', 'dark') : root.removeAttribute('data-theme')
        }
      }
    },

    setLanguage(lang: string) {
      this.language = lang
      this.save()
    },

    reset() {
      this.$patch(DEFAULT_CONFIG)
      this.save()
    },
  },
})
