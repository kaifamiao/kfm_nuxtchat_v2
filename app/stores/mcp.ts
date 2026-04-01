import { defineStore } from 'pinia'
import { db, DB_KEYS } from '~/utils/db'

export interface McpServer {
  id: string
  name: string
  url: string
  type: 'sse' | 'stdio'
  enabled: boolean
  status: 'connected' | 'disconnected' | 'error'
}

export interface McpTool {
  id: string
  serverId: string
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

export interface OpenAITool {
  type: 'function'
  function: { name: string; description: string; parameters: Record<string, unknown> }
}

interface McpState {
  servers: McpServer[]
  tools: McpTool[]
  isEnabled: boolean
}

const DEFAULT_SERVERS: McpServer[] = [
  {
    id: 'builtin',
    name: 'NuxtChat 内置工具',
    url: '/api/mcp',
    type: 'sse',
    enabled: false,
    status: 'disconnected',
  },
]

export const useMcpStore = defineStore('mcp', {
  state: (): McpState => ({
    servers: DEFAULT_SERVERS.map(s => ({ ...s })),
    tools: [],
    isEnabled: false,
  }),

  getters: {
    enabledServers: (state) => state.servers.filter(s => s.enabled && s.status === 'connected'),

    /** 将已连接的工具转为 OpenAI function calling 格式 */
    openAITools: (state): OpenAITool[] => {
      const activeIds = new Set(
        state.servers.filter(s => s.enabled && s.status === 'connected').map(s => s.id),
      )
      return state.tools
        .filter(t => activeIds.has(t.serverId))
        .map(t => ({
          type: 'function' as const,
          function: { name: t.name, description: t.description, parameters: t.inputSchema },
        }))
    },
  },

  actions: {
    async save() {
      await db.set(DB_KEYS.MCP_STORE, {
        servers: this.servers,
        tools: this.tools,
        isEnabled: this.isEnabled,
      })
    },

    async load() {
      const saved = await db.get<McpState>(DB_KEYS.MCP_STORE)
      if (!saved) return
      const savedIds = new Set(saved.servers.map(s => s.id))
      const newDefaults = DEFAULT_SERVERS.filter(s => !savedIds.has(s.id))
      this.servers = [
        ...saved.servers.map(s => ({ ...s, status: 'disconnected' as const })),
        ...newDefaults,
      ]
      this.tools = saved.tools || []
      this.isEnabled = saved.isEnabled || false
      if (this.isEnabled) {
        for (const s of this.servers.filter(s => s.enabled))
          this.connectServer(s.id).catch(() => {})
      }
    },

    toggleEnabled() {
      this.isEnabled = !this.isEnabled
      this.save()
    },

    /** 实际连接：initialize → tools/list */
    async connectServer(id: string) {
      const server = this.servers.find(s => s.id === id)
      if (!server) return
      try {
        await $fetch(server.url, {
          method: 'POST',
          body: { jsonrpc: '2.0', method: 'initialize', params: {}, id: 1 },
        })
        const resp = await $fetch<any>(server.url, {
          method: 'POST',
          body: { jsonrpc: '2.0', method: 'tools/list', params: {}, id: 2 },
        })
        const rawTools: any[] = resp?.result?.tools || []
        this._setTools(id, rawTools.map(t => ({
          id: `${id}:${t.name}`,
          serverId: id,
          name: t.name,
          description: t.description || '',
          inputSchema: t.inputSchema || { type: 'object', properties: {} },
        })))
        server.status = 'connected'
      }
      catch {
        server.status = 'error'
        server.enabled = false
      }
      await this.save()
    },

    /** 切换启用：开启时自动连接，关闭时清除工具 */
    async toggleServer(id: string) {
      const server = this.servers.find(s => s.id === id)
      if (!server) return
      server.enabled = !server.enabled
      if (server.enabled) {
        await this.connectServer(id)
      }
      else {
        server.status = 'disconnected'
        this.tools = this.tools.filter(t => t.serverId !== id)
        await this.save()
      }
    },

    addServer(server: Omit<McpServer, 'id' | 'status'>) {
      this.servers.push({ ...server, id: `server-${Date.now()}`, status: 'disconnected' })
      this.save()
    },

    removeServer(id: string) {
      this.servers = this.servers.filter(s => s.id !== id)
      this.tools = this.tools.filter(t => t.serverId !== id)
      this.save()
    },

    _setTools(serverId: string, tools: McpTool[]) {
      this.tools = [...this.tools.filter(t => t.serverId !== serverId), ...tools]
    },
  },
})
