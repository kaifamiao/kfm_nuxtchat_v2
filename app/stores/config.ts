import { defineStore } from 'pinia'
import { db, DB_KEYS } from '~/utils/db'
import type { ModelConfig, ModelProvider, ThemeMode } from '~/utils/types'
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from '~/utils/models'

export interface CustomColors {
  /** 侧边栏背景色 → --color-sidebar */
  sidebar: string
  /** 历史记录项选中背景 → --color-sidebar-active */
  chatHistory: string
  /** 主对话区背景色 → --color-bg */
  chatArea: string
  /** 用户气泡背景色 → --color-user-bubble */
  userBubble: string
  /** 用户气泡字体色 → --color-user-bubble-text */
  userBubbleText: string
  /** 助理气泡背景色 → --color-assistant-bubble */
  assistantBubble: string
  /** 助理气泡字体色 → --color-assistant-bubble-text */
  assistantBubbleText: string
}

/** 亮色模式下各区域的默认色值（与 main.css 保持一致） */
export const DEFAULT_COLORS_LIGHT: CustomColors = {
  sidebar: '#f7f7f8',
  chatHistory: '#e0e0e0',
  chatArea: '#ffffff',
  userBubble: '#10a37f',
  userBubbleText: '#ffffff',
  assistantBubble: '#f7f7f8',
  assistantBubbleText: '#343541',
}

/** 深色模式下的默认色值 */
export const DEFAULT_COLORS_DARK: CustomColors = {
  sidebar: '#171717',
  chatHistory: '#333333',
  chatArea: '#212121',
  userBubble: '#10a37f',
  userBubbleText: '#ffffff',
  assistantBubble: '#2f2f2f',
  assistantBubbleText: '#ececf1',
}

export interface AppConfig {
  // Model config
  modelConfig: ModelConfig
  // UI
  theme: ThemeMode
  language: string
  fontSize: number
  sidebarWidth: number
  // 自定义配色（为空字符串表示使用 CSS 默认值）
  customColors: CustomColors
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
  customColors: { sidebar: '', chatHistory: '', chatArea: '', userBubble: '', userBubbleText: '', assistantBubble: '', assistantBubbleText: '' },
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

    setFontSize(size: number) {
      this.fontSize = size
      this.save()
      if (import.meta.client) {
        // 设置在 <html> 上，Tailwind 的 rem 单位才会随之缩放
        document.documentElement.style.fontSize = `${size}px`
      }
    },

    setLanguage(lang: string) {
      this.language = lang
      this.save()
    },

    /** 将自定义色值写入 CSS 变量；空字符串则移除覆盖，恢复 main.css 默认值 */
    setCustomColors(colors: Partial<CustomColors>) {
      this.customColors = { ...this.customColors, ...colors }
      this.save()
      if (!import.meta.client) return
      const root = document.documentElement
      const apply = (varName: string, val: string) => {
        val ? root.style.setProperty(varName, val) : root.style.removeProperty(varName)
      }
      apply('--color-sidebar',                this.customColors.sidebar)
      apply('--color-sidebar-active',         this.customColors.chatHistory)
      apply('--color-bg',                     this.customColors.chatArea)
      apply('--color-user-bubble',            this.customColors.userBubble)
      apply('--color-user-bubble-text',       this.customColors.userBubbleText)
      apply('--color-assistant-bubble',       this.customColors.assistantBubble)
      apply('--color-assistant-bubble-text',  this.customColors.assistantBubbleText)
    },

    /** 恢复所有配色为 CSS 默认值 */
    resetColors() {
      this.setCustomColors({ sidebar: '', chatHistory: '', chatArea: '', userBubble: '', userBubbleText: '', assistantBubble: '', assistantBubbleText: '' })
    },

    reset() {
      this.$patch(DEFAULT_CONFIG)
      this.save()
      if (import.meta.client) {
        const root = document.documentElement
        root.style.removeProperty('--color-sidebar')
        root.style.removeProperty('--color-sidebar-active')
        root.style.removeProperty('--color-bg')
      }
    },
  },
})
