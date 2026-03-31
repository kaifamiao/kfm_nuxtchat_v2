<script setup lang="ts">
export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration: number
}

const toasts = ref<Toast[]>([])

function show(message: string, type: Toast['type'] = 'info', duration = 3000) {
  const id = `toast-${Date.now()}`
  toasts.value.push({ id, message, type, duration })
  setTimeout(() => remove(id), duration)
}

function remove(id: string) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

// Expose globally
defineExpose({ show, success: (m: string) => show(m, 'success'), error: (m: string) => show(m, 'error') })

const typeConfig = {
  success: { bg: 'bg-green-500', icon: 'confirm' },
  error: { bg: 'bg-red-500', icon: 'cancel' },
  warning: { bg: 'bg-amber-500', icon: 'lightning' },
  info: { bg: 'bg-blue-500', icon: 'brain' },
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-lg text-sm font-medium pointer-events-auto max-w-xs"
          :class="typeConfig[toast.type].bg"
        >
          <AppIcon :name="typeConfig[toast.type].icon" :size="14" color="white" />
          {{ toast.message }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateX(100%); }
.toast-leave-to   { opacity: 0; transform: translateX(100%); }
</style>
