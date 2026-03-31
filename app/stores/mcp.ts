import { defineStore } from 'pinia'

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

interface McpState {
  servers: McpServer[]
  tools: McpTool[]
  isEnabled: boolean
}

const DEFAULT_SERVERS: McpServer[] = [
  {
    id: 'filesystem',
    name: 'Filesystem',
    url: '/api/mcp/filesystem',
    type: 'sse',
    enabled: false,
    status: 'disconnected',
  },
  {
    id: 'web-search',
    name: 'Web Search',
    url: '/api/mcp/search',
    type: 'sse',
    enabled: false,
    status: 'disconnected',
  },
]

export const useMcpStore = defineStore('mcp', {
  state: (): McpState => ({
    servers: [...DEFAULT_SERVERS],
    tools: [],
    isEnabled: false,
  }),

  getters: {
    enabledServers: (state) => state.servers.filter(s => s.enabled),
    connectedServers: (state) => state.servers.filter(s => s.status === 'connected'),
    availableTools: (state) => (serverId?: string) => {
      if (serverId) return state.tools.filter(t => t.serverId === serverId)
      return state.tools.filter(t =>
        state.servers.find(s => s.id === t.serverId && s.enabled),
      )
    },
  },

  actions: {
    toggleEnabled() {
      this.isEnabled = !this.isEnabled
    },

    addServer(server: Omit<McpServer, 'id' | 'status'>) {
      this.servers.push({
        ...server,
        id: `server-${Date.now()}`,
        status: 'disconnected',
      })
    },

    removeServer(id: string) {
      this.servers = this.servers.filter(s => s.id !== id)
      this.tools = this.tools.filter(t => t.serverId !== id)
    },

    toggleServer(id: string) {
      const server = this.servers.find(s => s.id === id)
      if (server) server.enabled = !server.enabled
    },

    updateServerStatus(id: string, status: McpServer['status']) {
      const server = this.servers.find(s => s.id === id)
      if (server) server.status = status
    },

    setTools(serverId: string, tools: McpTool[]) {
      this.tools = this.tools.filter(t => t.serverId !== serverId)
      this.tools.push(...tools.map(t => ({ ...t, serverId })))
    },
  },
})
