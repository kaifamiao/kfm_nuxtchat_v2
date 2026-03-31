<script setup lang="ts">
import { useConfigStore } from '~/stores/config'
import { useChatStore } from '~/stores/chat'
import { useMaskStore } from '~/stores/mask'
import { useAccessStore } from '~/stores/access'

const configStore = useConfigStore()
const chatStore = useChatStore()
const maskStore = useMaskStore()
const accessStore = useAccessStore()

// Load all stores from IndexedDB on startup
onMounted(async () => {
  await Promise.all([
    configStore.load(),
    chatStore.load(),
    maskStore.load(),
    accessStore.load(),
  ])
  configStore.setTheme(configStore.theme) // Apply saved theme
})

const isMobile = useMediaQuery('(max-width: 768px)')
const sidebarOpen = ref(true)

// Auto-close sidebar on mobile
watch(isMobile, (mobile) => { if (mobile) sidebarOpen.value = false })
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-(--color-bg)" :style="{ fontSize: `${configStore.fontSize}px` }">
    <!-- Sidebar -->
    <Transition name="sidebar">
      <AppSidebar
        v-show="sidebarOpen || !isMobile"
        :class="isMobile ? 'fixed inset-y-0 left-0 z-40 shadow-2xl' : 'relative'"
      />
    </Transition>

    <!-- Mobile overlay -->
    <div
      v-if="isMobile && sidebarOpen"
      class="fixed inset-0 z-30 bg-black/50"
      @click="sidebarOpen = false"
    />

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <!-- Mobile header -->
      <div v-if="isMobile" class="flex items-center gap-3 px-4 py-3 border-b border-(--color-border) shrink-0">
        <button
          class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-(--color-bg-secondary) transition-colors"
          @click="sidebarOpen = !sidebarOpen"
        >
          <AppIcon name="menu" :size="18" />
        </button>
        <h1 class="text-sm font-semibold text-(--color-text) truncate">
          {{ chatStore.currentSession?.topic || '新的对话' }}
        </h1>
      </div>

      <slot />
    </div>

    <!-- Global toast -->
    <AppToast ref="toast" />
  </div>
</template>

<style scoped>
.sidebar-enter-active, .sidebar-leave-active { transition: transform 0.25s ease; }
.sidebar-enter-from, .sidebar-leave-to { transform: translateX(-100%); }
</style>
