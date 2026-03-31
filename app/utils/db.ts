/**
 * IndexedDB 持久化工具（基于 idb-keyval）
 * 用于替代 Next.js 的 localStorage + zustand/persist
 */
import { get, set, del, entries, createStore } from 'idb-keyval'

const DB_NAME = 'nuxtchat'
const STORE_NAME = 'keyval'

// 创建专属 store
const customStore = import.meta.client
  ? createStore(DB_NAME, STORE_NAME)
  : null

export const db = {
  async get<T>(key: string): Promise<T | undefined> {
    if (!import.meta.client) return undefined
    try {
      return await get<T>(key, customStore!)
    } catch {
      return undefined
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    if (!import.meta.client) return
    try {
      await set(key, value, customStore!)
    } catch (e) {
      console.error('[db] set error:', e)
    }
  },

  async del(key: string): Promise<void> {
    if (!import.meta.client) return
    try {
      await del(key, customStore!)
    } catch {}
  },

  async getAll(): Promise<[IDBValidKey, unknown][]> {
    if (!import.meta.client) return []
    try {
      return await entries(customStore!)
    } catch {
      return []
    }
  },

  async exportAll(): Promise<Record<string, unknown>> {
    const allEntries = await db.getAll()
    return Object.fromEntries(allEntries.map(([k, v]) => [String(k), v]))
  },

  async importAll(data: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await db.set(key, value)
    }
  },
}

// ─── DB Keys ─────────────────────────────────────────────────────────────────
export const DB_KEYS = {
  CHAT_STORE: 'chat-store',
  CONFIG_STORE: 'config-store',
  ACCESS_STORE: 'access-store',
  MASK_STORE: 'mask-store',
  PLUGIN_STORE: 'plugin-store',
  PROMPT_STORE: 'prompt-store',
  SYNC_STORE: 'sync-store',
} as const
