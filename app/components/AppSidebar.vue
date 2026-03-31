<script setup lang="ts">
import { useChatStore } from '~/stores/chat'
import { useConfigStore } from '~/stores/config'

const chatStore = useChatStore()
const configStore = useConfigStore()
const router = useRouter()

const searchText = ref('')
const showSettings = ref(false)
const showMask = ref(false)

const filteredSessions = computed(() => {
  const sessions = chatStore.sortedSessions
  if (!searchText.value.trim()) return sessions
  const q = searchText.value.toLowerCase()
  return sessions.filter(s =>
    s.topic.toLowerCase().includes(q) ||
    s.messages.some(m => typeof m.content === 'string' && m.content.toLowerCase().includes(q)),
  )
})

function newChat() {
  chatStore.newSession()
}
function selectSession(id: string) {
  chatStore.selectSession(id)
}
function deleteSession(id: string, e: Event) {
  e.stopPropagation()
  if (confirm('确认删除此对话？')) chatStore.deleteSession(id)
}
function formatTime(ms: number) {
  const date = new Date(ms)
  const now = new Date()
  const diff = now.getTime() - ms
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
</script>

<template>
  <aside
    class="flex flex-col bg-(--color-sidebar) text-gray-100 shrink-0"
    :style="{ width: `${configStore.sidebarWidth}px` }"
  >
    <!-- Logo & New Chat -->
    <div class="flex items-center gap-2 px-3 py-4 border-b border-white/10">
      <AppIcon name="logo" :size="24" color="white" class="shrink-0" />
      <span class="font-bold text-sm flex-1 truncate">NuxtChat</span>
      <button
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
        title="新建对话"
        @click="newChat"
      >
        <AppIcon name="add" :size="16" color="white" />
      </button>
    </div>

    <!-- Search -->
    <div class="px-3 py-2">
      <div class="flex items-center gap-2 bg-white/10 rounded-lg px-3 h-8">
        <AppIcon name="prompt" :size="12" color="rgba(255,255,255,0.6)" />
        <input
          v-model="searchText"
          class="flex-1 bg-transparent text-xs text-white placeholder-white/50 outline-none"
          placeholder="搜索对话..."
        />
      </div>
    </div>

    <!-- Session List -->
    <div class="flex-1 overflow-y-auto px-2 py-1">
      <div
        v-for="session in filteredSessions"
        :key="session.id"
        class="group flex items-start gap-2 px-3 py-3 rounded-xl cursor-pointer mb-1 transition-colors"
        :class="session.id === chatStore.currentSessionId
          ? 'bg-white/20'
          : 'hover:bg-white/10'"
        @click="selectSession(session.id)"
      >
        <div class="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
          <AppIcon :name="session.mask.avatar" :size="14" color="rgba(255,255,255,0.85)" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1">
            <span class="text-xs font-medium text-white truncate">{{ session.topic }}</span>
            <span class="text-[10px] text-white/40 shrink-0">{{ formatTime(session.lastUpdate) }}</span>
          </div>
          <p class="text-[11px] text-white/50 truncate mt-0.5">
            {{ session.messages.at(-1) ? (typeof session.messages.at(-1)!.content === 'string' ? session.messages.at(-1)!.content : '…') : '还没有消息' }}
          </p>
        </div>
        <button
          class="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/30 transition-all shrink-0"
          @click="deleteSession(session.id, $event)"
        >
          <AppIcon name="delete" :size="12" color="rgba(255,255,255,0.6)" />
        </button>
      </div>

      <div v-if="!filteredSessions.length" class="text-center py-8 text-white/30 text-xs">
        {{ searchText ? '没有匹配的对话' : '还没有对话，点击 + 开始' }}
      </div>
    </div>

    <!-- Bottom nav -->
    <div class="flex items-center justify-between px-3 py-3 border-t border-white/10">
      <button
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
        title="提示词模板"
        @click="showMask = true"
      >
        <AppIcon name="mask" :size="16" color="rgba(255,255,255,0.7)" />
      </button>
      <button
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
        title="插件"
        @click="() => router.push('/plugin')"
      >
        <AppIcon name="plugin" :size="16" color="rgba(255,255,255,0.7)" />
      </button>
      <button
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
        title="MCP 工具"
        @click="() => router.push('/mcp')"
      >
        <AppIcon name="mcp" :size="16" color="rgba(255,255,255,0.7)" />
      </button>
      <button
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
        title="设置"
        @click="showSettings = true"
      >
        <AppIcon name="settings" :size="16" color="rgba(255,255,255,0.7)" />
      </button>
    </div>
  </aside>

  <!-- Settings Modal -->
  <SettingsModal v-model="showSettings" />
  <!-- Mask Gallery Modal -->
  <MaskGallery v-model="showMask" />
</template>
