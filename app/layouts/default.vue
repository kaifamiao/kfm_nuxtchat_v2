<script setup lang="ts">
import { useChatStore } from '~/stores/chat'

const chatStore = useChatStore()

// 完全使用原生 window.matchMedia，彻底绕过 useMediaQuery 初始值为 false 的问题
// ssr: false 保证此处 window 始终可用
const mq = window.matchMedia('(max-width: 768px)')
const isMobile = ref(mq.matches)
const sidebarOpen = ref(!mq.matches)

onMounted(() => {
  const handler = (e: MediaQueryListEvent) => {
    isMobile.value = e.matches
    sidebarOpen.value = !e.matches
  }
  mq.addEventListener('change', handler)
  onUnmounted(() => mq.removeEventListener('change', handler))
})
</script>

<template>
  <div class="flex overflow-hidden bg-(--color-bg)" style="height: 100dvh;">

    <!-- 桌面端：侧边栏常驻，参与 flex 布局 -->
    <div v-if="!isMobile" class="shrink-0 h-full">
      <AppSidebar />
    </div>

    <!-- 移动端：抽屉式侧边栏，fixed 定位，按需显示 -->
    <template v-if="isMobile">
      <!-- 遮罩 -->
      <Transition name="overlay">
        <div
          v-if="sidebarOpen"
          class="fixed inset-0 z-30 bg-black/50"
          @click="sidebarOpen = false"
        />
      </Transition>
      <!-- 抽屉 -->
      <Transition name="sidebar">
        <div
          v-if="sidebarOpen"
          class="fixed inset-y-0 left-0 z-40 shadow-2xl h-full"
          style="width: min(300px, 85vw)"
        >
          <AppSidebar />
        </div>
      </Transition>
    </template>

    <!-- 主内容区 -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- 移动端顶栏 -->
      <div
        v-if="isMobile"
        class="mobile-header flex items-center gap-3 px-4 border-b border-(--color-border) shrink-0"
      >
        <button
          class="w-11 h-11 flex items-center justify-center rounded-xl active:bg-(--color-bg-secondary) transition-colors"
          @click="sidebarOpen = !sidebarOpen"
        >
          <AppIcon name="menu" :size="20" />
        </button>
        <h1 class="text-sm font-semibold text-(--color-text) truncate flex-1">
          {{ chatStore.currentSession?.topic || '新的对话' }}
        </h1>
      </div>

      <slot />
    </div>

    <AppToast ref="toast" />
  </div>
</template>

<style scoped>
.sidebar-enter-active, .sidebar-leave-active { transition: transform 0.25s ease; }
.sidebar-enter-from, .sidebar-leave-to { transform: translateX(-100%); }

.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }

.mobile-header {
  padding-top: calc(0.75rem + var(--safe-top, 0px));
  padding-bottom: 0.75rem;
}
</style>
