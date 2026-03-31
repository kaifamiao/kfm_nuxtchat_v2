import { defineStore } from 'pinia'
import { db, DB_KEYS } from '~/utils/db'
import type { SyncType, WebDavConfig, UpstashConfig } from '~/utils/types'

interface SyncState {
  provider: SyncType | ''
  lastSyncTime: number
  isSyncing: boolean
  webdav: WebDavConfig
  upstash: UpstashConfig
  autoSync: boolean
  syncInterval: number  // minutes
}

export const useSyncStore = defineStore('sync', {
  state: (): SyncState => ({
    provider: '',
    lastSyncTime: 0,
    isSyncing: false,
    webdav: { server: '', username: '', password: '', filename: 'nuxtchat-backup.json' },
    upstash: { endpoint: '', username: '', apiKey: '' },
    autoSync: false,
    syncInterval: 60,
  }),

  getters: {
    lastSyncTimeStr: (state): string => {
      if (!state.lastSyncTime) return '从未同步'
      return new Date(state.lastSyncTime).toLocaleString('zh-CN')
    },
  },

  actions: {
    async load() {
      const saved = await db.get<SyncState>(DB_KEYS.SYNC_STORE)
      if (saved) this.$patch({ ...saved, isSyncing: false })
    },

    async save() {
      await db.set(DB_KEYS.SYNC_STORE, this.$state)
    },

    update(config: Partial<SyncState>) {
      this.$patch(config)
      this.save()
    },

    /** 导出所有数据为 JSON */
    async exportData(): Promise<string> {
      const data = await db.exportAll()
      return JSON.stringify(data, null, 2)
    },

    /** 从 JSON 导入数据 */
    async importData(jsonStr: string): Promise<void> {
      const data = JSON.parse(jsonStr)
      await db.importAll(data)
    },

    /** WebDAV 同步上传 */
    async syncToWebDAV(): Promise<void> {
      if (!this.webdav.server) throw new Error('WebDAV 服务器地址未配置')
      this.isSyncing = true
      try {
        const content = await this.exportData()
        const url = `${this.webdav.server.replace(/\/$/, '')}/${this.webdav.filename}`
        const resp = await $fetch('/api/webdav/upload', {
          method: 'POST',
          body: { url, username: this.webdav.username, password: this.webdav.password, content },
        })
        this.lastSyncTime = Date.now()
        this.save()
      } finally {
        this.isSyncing = false
      }
    },

    /** WebDAV 同步下载 */
    async syncFromWebDAV(): Promise<void> {
      if (!this.webdav.server) throw new Error('WebDAV 服务器地址未配置')
      this.isSyncing = true
      try {
        const url = `${this.webdav.server.replace(/\/$/, '')}/${this.webdav.filename}`
        const resp = await $fetch<{ content: string }>('/api/webdav/download', {
          method: 'POST',
          body: { url, username: this.webdav.username, password: this.webdav.password },
        })
        await this.importData(resp.content)
        this.lastSyncTime = Date.now()
        this.save()
      } finally {
        this.isSyncing = false
      }
    },
  },
})
