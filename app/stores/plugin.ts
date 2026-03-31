import { defineStore } from 'pinia'
import { db, DB_KEYS } from '~/utils/db'
import type { Plugin } from '~/utils/types'
import { createId, nowMs } from '~/utils/common'

// 内置插件
const BUILTIN_PLUGINS: Plugin[] = [
  {
    id: 'web-search',
    createdAt: 0,
    title: '网络搜索',
    version: '1.0',
    builtin: true,
    content: JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Web Search', version: '1.0' },
      paths: {
        '/search': {
          get: {
            operationId: 'webSearch',
            summary: '搜索互联网',
            parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }],
          },
        },
      },
    }),
  },
]

interface PluginState {
  plugins: Plugin[]
  enabledPluginIds: string[]
}

export const usePluginStore = defineStore('plugin', {
  state: (): PluginState => ({
    plugins: [],
    enabledPluginIds: [],
  }),

  getters: {
    allPlugins: (state): Plugin[] => [...BUILTIN_PLUGINS, ...state.plugins],
    enabledPlugins: (state): Plugin[] => {
      const all = [...BUILTIN_PLUGINS, ...state.plugins]
      return all.filter(p => state.enabledPluginIds.includes(p.id))
    },
  },

  actions: {
    async load() {
      const saved = await db.get<PluginState>(DB_KEYS.PLUGIN_STORE)
      if (saved) this.$patch(saved)
    },

    async save() {
      await db.set(DB_KEYS.PLUGIN_STORE, this.$state)
    },

    addPlugin(content: string, title?: string): Plugin {
      const plugin: Plugin = {
        id: createId(),
        createdAt: nowMs(),
        title: title || '新插件',
        version: '1.0',
        content,
        builtin: false,
      }
      this.plugins.push(plugin)
      this.save()
      return plugin
    },

    removePlugin(id: string) {
      this.plugins = this.plugins.filter(p => p.id !== id)
      this.enabledPluginIds = this.enabledPluginIds.filter(i => i !== id)
      this.save()
    },

    togglePlugin(id: string) {
      const idx = this.enabledPluginIds.indexOf(id)
      if (idx >= 0) this.enabledPluginIds.splice(idx, 1)
      else this.enabledPluginIds.push(id)
      this.save()
    },

    isEnabled(id: string): boolean {
      return this.enabledPluginIds.includes(id)
    },
  },
})
