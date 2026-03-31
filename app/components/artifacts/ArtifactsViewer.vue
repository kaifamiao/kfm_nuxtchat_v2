<script setup lang="ts">
const props = defineProps<{
  content: string
  type?: 'html' | 'svg' | 'mermaid' | 'code'
  lang?: string
}>()

const emit = defineEmits<{ close: [] }>()

const iframeRef = ref<HTMLIFrameElement>()
const isFullscreen = ref(false)

// Build sandboxed HTML
const sandboxedHTML = computed(() => {
  if (props.type === 'html') {
    return props.content
  }
  if (props.type === 'svg') {
    return `<!DOCTYPE html><html><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;">${props.content}</body></html>`
  }
  return `<!DOCTYPE html><html><head><style>body{font-family:monospace;padding:16px;}</style></head><body><pre>${props.content}</pre></body></html>`
})

const srcDoc = computed(() => sandboxedHTML.value)

function toggleFullscreen() { isFullscreen.value = !isFullscreen.value }

function downloadHTML() {
  const blob = new Blob([props.content], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'artifact.html'; a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div
    class="flex flex-col border border-(--color-border) rounded-xl overflow-hidden bg-(--color-bg) shadow-md"
    :class="isFullscreen ? 'fixed inset-4 z-50' : 'w-full'"
  >
    <!-- Toolbar -->
    <div class="flex items-center gap-2 px-3 py-2 bg-(--color-bg-secondary) border-b border-(--color-border) shrink-0">
      <span class="w-3 h-3 rounded-full bg-red-400" />
      <span class="w-3 h-3 rounded-full bg-yellow-400" />
      <span class="w-3 h-3 rounded-full bg-green-400" />
      <span class="text-xs text-(--color-text-muted) ml-2">{{ type?.toUpperCase() || 'PREVIEW' }}</span>
      <div class="flex-1" />
      <button class="p-1 rounded hover:bg-(--color-bg-tertiary) transition-colors" title="下载" @click="downloadHTML">
        <AppIcon name="download" :size="12" class="text-(--color-text-muted)" />
      </button>
      <button class="p-1 rounded hover:bg-(--color-bg-tertiary) transition-colors" :title="isFullscreen ? '退出全屏' : '全屏'" @click="toggleFullscreen">
        <AppIcon :name="isFullscreen ? 'min' : 'max'" :size="12" class="text-(--color-text-muted)" />
      </button>
      <button class="p-1 rounded hover:bg-(--color-bg-tertiary) transition-colors" title="关闭" @click="emit('close')">
        <AppIcon name="close" :size="12" class="text-(--color-text-muted)" />
      </button>
    </div>

    <!-- Sandbox iframe -->
    <iframe
      ref="iframeRef"
      :srcdoc="srcDoc"
      sandbox="allow-scripts allow-same-origin allow-forms"
      class="w-full flex-1 border-none"
      :style="isFullscreen ? 'min-height: calc(100vh - 80px)' : 'min-height: 300px; max-height: 500px'"
    />
  </div>
</template>
