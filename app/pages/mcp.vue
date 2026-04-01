<script setup lang="ts">
import { useMcpStore } from '~/stores/mcp'
import type { McpServer } from '~/stores/mcp'

definePageMeta({ layout: 'default' })

const mcpStore = useMcpStore()
const showAddModal = ref(false)
const newServer = ref<Partial<McpServer>>({ name: '', url: '', type: 'sse', enabled: false })

function addServer() {
  if (!newServer.value.name || !newServer.value.url) return
  mcpStore.addServer({
    name: newServer.value.name!,
    url: newServer.value.url!,
    type: newServer.value.type || 'sse',
    enabled: false,
  })
  showAddModal.value = false
  newServer.value = { name: '', url: '', type: 'sse', enabled: false }
}

const statusColor: Record<McpServer['status'], string> = {
  connected: 'text-green-500',
  disconnected: 'text-(--color-text-muted)',
  error: 'text-red-500',
}
const statusLabel: Record<McpServer['status'], string> = {
  connected: '已连接',
  disconnected: '未连接',
  error: '错误',
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="flex items-center gap-3 px-6 py-4 border-b border-(--color-border) bg-(--color-bg) shrink-0">
      <AppIcon name="mcp" :size="20" class="text-(--color-text-muted)" />
      <div>
        <h1 class="text-base font-semibold text-(--color-text)">MCP 工具市场</h1>
        <p class="text-xs text-(--color-text-muted)">Model Context Protocol</p>
      </div>
      <div class="flex-1" />
      <!-- Global enable toggle -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-(--color-text-secondary)">{{ mcpStore.isEnabled ? '已启用' : '已禁用' }}</span>
        <button
          class="w-10 h-6 rounded-full transition-colors relative"
          :class="mcpStore.isEnabled ? 'bg-(--color-primary)' : 'bg-(--color-bg-tertiary)'"
          @click="mcpStore.toggleEnabled"
        >
          <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
            :class="mcpStore.isEnabled ? 'translate-x-4' : 'translate-x-0'" />
        </button>
      </div>
      <AppButton variant="primary" icon="add" @click="showAddModal = true">添加服务器</AppButton>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      <div v-if="!mcpStore.isEnabled" class="flex flex-col items-center justify-center h-full gap-3 text-(--color-text-muted)">
        <AppIcon name="mcp" :size="48" class="opacity-30" />
        <p class="text-sm">MCP 功能未启用，点击右上角开关启用</p>
      </div>

      <template v-else>
        <p class="text-xs text-(--color-text-muted) mb-4">
          MCP 服务器为 AI 提供外部工具调用能力（文件系统、数据库、搜索等）。
        </p>
        <div class="flex flex-col gap-3">
          <div
            v-for="server in mcpStore.servers"
            :key="server.id"
            class="flex items-center gap-4 p-4 border border-(--color-border) rounded-xl transition-colors"
            :class="server.enabled ? 'border-(--color-primary)/30 bg-(--color-primary-light)/30' : ''"
          >
            <div class="w-10 h-10 rounded-lg bg-(--color-bg-secondary) flex items-center justify-center shrink-0">
              <AppIcon name="mcp" :size="18" class="text-(--color-primary)" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-(--color-text)">{{ server.name }}</p>
                <span class="text-[10px] px-1.5 py-0.5 bg-(--color-bg-secondary) rounded text-(--color-text-muted) uppercase">{{ server.type }}</span>
              </div>
              <p class="text-xs text-(--color-text-muted) truncate">{{ server.url }}</p>
              <p class="text-xs mt-0.5" :class="statusColor[server.status]">● {{ statusLabel[server.status] }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button
                class="w-10 h-6 rounded-full transition-colors relative"
                :class="server.enabled ? 'bg-(--color-primary)' : 'bg-(--color-bg-tertiary)'"
                @click="mcpStore.toggleServer(server.id)"
              >
                <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                  :class="server.enabled ? 'translate-x-4' : 'translate-x-0'" />
              </button>
              <button
                class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 transition-colors"
                @click="mcpStore.removeServer(server.id)"
              >
                <AppIcon name="delete" :size="14" class="text-(--color-text-muted)" />
              </button>
            </div>
          </div>
        </div>

        <!-- Available tools -->
        <div v-if="mcpStore.tools.length" class="mt-6">
          <h3 class="text-sm font-semibold text-(--color-text) mb-3">可用工具（{{ mcpStore.tools.length }}）</h3>
          <div class="grid grid-cols-2 gap-2">
            <div v-for="tool in mcpStore.tools" :key="tool.id"
              class="p-3 border border-(--color-border) rounded-lg">
              <p class="text-sm font-medium text-(--color-text)">{{ tool.name }}</p>
              <p class="text-xs text-(--color-text-muted) line-clamp-2 mt-1">{{ tool.description }}</p>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Add server modal -->
    <AppModal v-model="showAddModal" title="添加 MCP 服务器" width="460px" @confirm="addServer">
      <div class="flex flex-col gap-4">
        <AppInput v-model="newServer.name" label="服务器名称" placeholder="My MCP Server" />
        <AppInput v-model="newServer.url" label="服务器 URL" placeholder="https://mcp.example.com/sse" />
        <div>
          <label class="block text-xs font-medium text-(--color-text-secondary) mb-2">连接类型</label>
          <div class="flex gap-2">
            <button v-for="t in ['sse', 'stdio'] as const" :key="t"
              class="px-3 py-1.5 rounded-lg border text-sm transition-colors"
              :class="newServer.type === t ? 'border-(--color-primary) bg-(--color-primary-light) text-(--color-primary)' : 'border-(--color-border) text-(--color-text-secondary)'"
              @click="newServer.type = t"
            >{{ t.toUpperCase() }}</button>
          </div>
        </div>
      </div>
    </AppModal>
  </div>
</template>
