<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  width?: string
  closable?: boolean
  footer?: boolean
}>(), {
  closable: true,
  footer: true,
  width: '520px',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
  confirm: []
}>()

function close() {
  emit('update:modelValue', false)
  emit('close')
}

// Close on Escape
onMounted(() => {
  const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && props.modelValue) close() }
  document.addEventListener('keydown', handler)
  onUnmounted(() => document.removeEventListener('keydown', handler))
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="closable && close()"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closable && close()" />

        <!-- Panel -->
        <div
          class="relative bg-(--color-bg) rounded-2xl shadow-2xl flex flex-col max-h-[90vh] w-full"
          :style="{ maxWidth: width }"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-(--color-border) shrink-0">
            <h3 class="text-base font-semibold text-(--color-text)">{{ title }}</h3>
            <button
              v-if="closable"
              class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-(--color-bg-secondary) transition-colors text-(--color-text-muted) hover:text-(--color-text)"
              @click="close"
            >
              <AppIcon name="close" :size="14" />
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="footer || $slots.footer" class="flex items-center justify-end gap-3 px-6 py-4 border-t border-(--color-border) shrink-0">
            <slot name="footer">
              <AppButton variant="secondary" @click="close">取消</AppButton>
              <AppButton variant="primary" @click="emit('confirm')">确认</AppButton>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .relative, .modal-leave-to .relative { transform: scale(0.95) translateY(-10px); }
</style>
