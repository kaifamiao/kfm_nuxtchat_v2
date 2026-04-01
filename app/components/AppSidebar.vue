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
  router.push('/')
}
function deleteSession(id: string, e: Event) {
  e.stopPropagation()
  if (confirm('确认删除此对话？')) chatStore.deleteSession(id)
}
const bottomNav = [
  { icon: 'mask',     title: '提示词模板', action: () => { showMask.value = true } },
  { icon: 'plugin',   title: '插件',       action: () => router.push('/plugin') },
  { icon: 'mcp',      title: 'MCP 工具',   action: () => router.push('/mcp') },
  { icon: 'settings', title: '设置',       action: () => { showSettings.value = true } },
]

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
  <aside class="sidebar flex flex-col shrink-0 h-full" :style="{ width: `${configStore.sidebarWidth}px` }">

    <!-- Logo & New Chat（顶部 safe area 留白） -->
    <div class="sidebar-header flex items-center gap-2 px-3 pb-4" style="padding-top: calc(1rem + var(--safe-top, 0px))">
      <AppLogo size="sm" class="flex-1 min-w-0 truncate" />
      <button class="sidebar-icon-btn" title="新建对话" @click="newChat">
        <AppIcon name="add" :size="16" />
      </button>
    </div>

    <!-- Search -->
    <div class="px-3 pb-2">
      <div class="sidebar-search-box flex items-center gap-2 px-3 h-8">
        <AppIcon name="prompt" :size="12" class="sidebar-text-muted" />
        <input
          v-model="searchText"
          class="sidebar-search-input flex-1 bg-transparent text-xs outline-none"
          placeholder="搜索对话..."
        />
      </div>
    </div>

    <!-- Session List -->
    <div class="flex-1 overflow-y-auto px-2 py-1">
      <div
        v-for="session in filteredSessions"
        :key="session.id"
        class="session-item group flex items-start gap-2 px-3 py-2.5 cursor-pointer mb-0.5"
        :class="{ 'is-active': session.id === chatStore.currentSessionId }"
        @click="selectSession(session.id)"
      >
        <!-- Avatar -->
        <div class="session-avatar w-7 h-7 flex items-center justify-center shrink-0 mt-0.5">
          <AppIcon :name="session.mask.avatar" :size="14" class="text-primary" />
        </div>

        <!-- Text -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1">
            <span class="text-xs font-medium truncate sidebar-text">{{ session.topic }}</span>
            <span class="text-[10px] sidebar-text-muted shrink-0">{{ formatTime(session.lastUpdate) }}</span>
          </div>
          <p class="text-[11px] truncate mt-0.5 sidebar-text-sub">
            {{ session.messages.at(-1)
              ? (typeof session.messages.at(-1)!.content === 'string'
                  ? session.messages.at(-1)!.content : '…')
              : '还没有消息' }}
          </p>
        </div>

        <!-- Delete（触摸设备上始终可见） -->
        <button
          class="delete-btn w-7 h-7 flex items-center justify-center transition-opacity shrink-0 touch-visible"
          @click.stop="deleteSession(session.id, $event)"
        >
          <AppIcon name="delete" :size="12" />
        </button>
      </div>

      <div v-if="!filteredSessions.length" class="text-center py-8 text-xs sidebar-text-muted">
        {{ searchText ? '没有匹配的对话' : '还没有对话，点击 + 开始' }}
      </div>
    </div>

    <!-- Bottom nav -->
    <div class="sidebar-footer flex items-center justify-between px-3 py-3">
      <button
        v-for="btn in bottomNav" :key="btn.icon"
        class="sidebar-icon-btn"
        :title="btn.title"
        @click="btn.action"
      >
        <AppIcon :name="btn.icon" :size="16" />
      </button>
    </div>

  </aside>

  <SettingsModal v-model="showSettings" />
  <MaskGallery v-model="showMask" />
</template>

<style scoped>
/* ── 侧边栏容器 ── */
.sidebar {
  background: var(--color-sidebar);
  border-right: 1px solid var(--color-sidebar-border);
}

/* ── 分割线 ── */
.sidebar-header { border-bottom: 1px solid var(--color-sidebar-border); }
.sidebar-footer  { border-top:    1px solid var(--color-sidebar-border); }

/* ── 文字颜色 ── */
.sidebar-text       { color: var(--color-sidebar-text); }
.sidebar-text-sub   { color: var(--color-sidebar-text-sub); }
.sidebar-text-muted { color: var(--color-sidebar-text-muted); }
.text-primary       { color: var(--color-primary); }

/* ── 搜索框 ── */
.sidebar-search-box {
  background:    var(--color-sidebar-hover);
  border-radius: var(--app-radius-md);
}
.sidebar-search-input {
  color:        var(--color-sidebar-text);
  caret-color:  var(--color-primary);
}
.sidebar-search-input::placeholder { color: var(--color-sidebar-text-muted); }

/* ── 图标按钮（顶部新建 & 底部导航） ── */
.sidebar-icon-btn {
  width:          2rem;
  height:         2rem;
  display:        flex;
  align-items:    center;
  justify-content: center;
  border-radius:  var(--app-radius-md);
  color:          var(--color-sidebar-icon);
  transition:     background 0.15s ease;
}
.sidebar-icon-btn:hover { background: var(--color-sidebar-hover); }

/* ── 会话列表项 ── */
.session-item {
  border-radius: var(--app-radius-md);
  transition:    background 0.15s ease;
}
.session-item:hover    { background: var(--color-sidebar-hover); }
.session-item.is-active { background: var(--color-sidebar-active); }

/* ── 会话 avatar 背景 ── */
.session-avatar {
  background:    var(--color-primary-light);
  border-radius: var(--app-radius-sm);
}

/* ── 删除按钮 ── */
.delete-btn {
  border-radius: var(--app-radius-sm);
  color:         var(--color-sidebar-text-muted);
  /* 桌面端默认隐藏，hover 时显示 */
  opacity: 0;
}
.session-item:hover .delete-btn { opacity: 1; }
.delete-btn:hover {
  background: rgba(239, 68, 68, 0.12);
  color:      #ef4444;
}
/* 触摸设备（移动端）：始终显示删除按钮（用户无法 hover） */
@media (pointer: coarse) {
  .delete-btn { opacity: 0.5; }
  .session-item.is-active .delete-btn { opacity: 1; }
}
</style>
