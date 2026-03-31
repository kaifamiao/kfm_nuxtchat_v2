import { defineStore } from 'pinia'

export type SDStatus = 'idle' | 'loading' | 'success' | 'error'

export interface SDTask {
  id: string
  prompt: string
  negativePrompt: string
  model: string
  steps: number
  width: number
  height: number
  guidance: number
  status: SDStatus
  imageUrl?: string
  error?: string
  createdAt: number
}

export interface SDConfig {
  baseUrl: string
  apiKey: string
  model: string
  steps: number
  width: number
  height: number
  guidance: number
  negativePrompt: string
}

interface SDState {
  tasks: SDTask[]
  config: SDConfig
  isDrawerOpen: boolean
}

export const useSDStore = defineStore('sd', {
  state: (): SDState => ({
    tasks: [],
    config: {
      baseUrl: 'https://api.stability.ai',
      apiKey: '',
      model: 'stable-diffusion-xl-1024-v1-0',
      steps: 30,
      width: 1024,
      height: 1024,
      guidance: 7.5,
      negativePrompt: 'blurry, bad quality, watermark',
    },
    isDrawerOpen: false,
  }),

  getters: {
    recentTasks: (state) => [...state.tasks].sort((a, b) => b.createdAt - a.createdAt).slice(0, 20),
    pendingCount: (state) => state.tasks.filter(t => t.status === 'loading').length,
  },

  actions: {
    updateConfig(config: Partial<SDConfig>) {
      this.config = { ...this.config, ...config }
    },

    async generate(prompt: string): Promise<string> {
      const task: SDTask = {
        id: `sd-${Date.now()}`,
        prompt,
        negativePrompt: this.config.negativePrompt,
        model: this.config.model,
        steps: this.config.steps,
        width: this.config.width,
        height: this.config.height,
        guidance: this.config.guidance,
        status: 'loading',
        createdAt: Date.now(),
      }
      this.tasks.unshift(task)

      try {
        const resp = await $fetch<{ imageUrl: string }>('/api/sd/generate', {
          method: 'POST',
          body: { ...this.config, prompt },
        })
        task.imageUrl = resp.imageUrl
        task.status = 'success'
        return resp.imageUrl
      } catch (e: any) {
        task.status = 'error'
        task.error = e.message || '生成失败'
        throw e
      }
    },

    removeTask(id: string) {
      this.tasks = this.tasks.filter(t => t.id !== id)
    },

    toggleDrawer() {
      this.isDrawerOpen = !this.isDrawerOpen
    },
  },
})
