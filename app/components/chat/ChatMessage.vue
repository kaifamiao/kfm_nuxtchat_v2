<script setup lang="ts">
import type { ChatMessage } from '~/utils/types'
import { copyToClipboard } from '~/utils/common'

const props = defineProps<{
  message: ChatMessage
  isLast?: boolean
}>()

const emit = defineEmits<{ retry: []; delete: [] }>()

const isCopied = ref(false)
const showActions = ref(false)
const zoomImg = ref<string | null>(null)

// 触摸设备：tap 气泡切换操作栏；桌面设备用 mouseenter/leave
function onBubbleTap() {
  if (window.matchMedia('(pointer: coarse)').matches) {
    showActions.value = !showActions.value
  }
}

const isUser = computed(() => props.message.role === 'user')
const isSystem = computed(() => props.message.role === 'system')
const contentText = computed(() => {
  const c = props.message.content
  return typeof c === 'string' ? c : c.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')
})

async function copy() {
  await copyToClipboard(contentText.value)
  isCopied.value = true
  setTimeout(() => isCopied.value = false, 2000)
}
</script>

<template>
  <!-- System message -->
  <div v-if="isSystem" class="flex justify-center my-2">
    <div class="text-xs text-(--color-text-muted) bg-(--color-bg-secondary) px-3 py-1 rounded-full">
      {{ contentText }}
    </div>
  </div>

  <!-- Regular message -->
  <div
    v-else
    class="group flex gap-3 px-4 py-3 hover:bg-(--color-bg-secondary)/50 transition-colors rounded-2xl mx-2"
    :class="isUser ? 'flex-row-reverse' : 'flex-row'"
    @mouseenter="showActions = true"
    @mouseleave="showActions = false"
    @click="onBubbleTap"
  >
    <!-- Avatar -->
    <div class="shrink-0 mt-1">
      <div
        class="w-8 h-8 rounded-full flex items-center justify-center text-sm"
        :class="isUser ? 'bg-(--color-primary) text-white' : 'bg-(--color-bg-tertiary)'"
      >
        <template v-if="isUser">
          <AppIcon name="prompt" :size="14" color="white" />
        </template>
        <template v-else>
          <AppIcon name="bot" :size="20" />
        </template>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0" :class="isUser ? 'flex flex-col items-end' : ''">
      <!-- Error badge -->
      <div v-if="message.isError" class="text-xs text-red-500 mb-1 flex items-center gap-1">
        <AppIcon name="cancel" :size="12" /> 请求失败
      </div>

      <!-- Message bubble -->
      <div
        class="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
        :class="[
          isUser
            ? 'bg-(--color-primary) text-white rounded-tr-sm'
            : 'bg-(--color-assistant-bubble) text-(--color-text) rounded-tl-sm',
          message.isError ? 'border border-red-300' : '',
        ]"
      >
        <!-- 图片附件（多模态消息） -->
        <div
          v-if="Array.isArray(message.content) && message.content.some((p: any) => p.type === 'image_url')"
          class="flex flex-wrap gap-2 mb-2"
        >
          <img
            v-for="(part, i) in (message.content as any[]).filter((p: any) => p.type === 'image_url')"
            :key="i"
            :src="part.image_url.url"
            class="max-h-48 max-w-full rounded-lg object-contain cursor-zoom-in"
            @click.stop="zoomImg = part.image_url.url"
          />
        </div>

        <!-- 文字内容 -->
        <template v-if="message.streaming">
          <MarkdownRenderer :content="contentText" />
          <span class="typing-cursor" />
        </template>
        <MarkdownRenderer v-else :content="contentText" />
      </div>

      <!-- Timestamp -->
      <span class="text-[11px] text-(--color-text-muted) mt-1 px-1">{{ message.date }}</span>

      <!-- Action buttons（触摸设备 tap 气泡切换，按钮更大可点击） -->
      <Transition name="fade">
        <div
          v-if="showActions && !message.streaming"
          class="flex items-center gap-1 mt-1"
          :class="isUser ? 'flex-row-reverse' : ''"
          @click.stop
        >
          <button
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-(--color-bg-tertiary) active:bg-(--color-bg-tertiary) transition-colors"
            :title="isCopied ? '已复制' : '复制'"
            @click="copy"
          >
            <AppIcon :name="isCopied ? 'confirm' : 'copy'" :size="14" class="text-(--color-text-muted)" />
          </button>
          <button
            v-if="!isUser && isLast"
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-(--color-bg-tertiary) active:bg-(--color-bg-tertiary) transition-colors"
            title="重新生成"
            @click="emit('retry')"
          >
            <AppIcon name="reload" :size="14" class="text-(--color-text-muted)" />
          </button>
          <button
            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 active:bg-red-100 transition-colors"
            title="删除"
            @click="emit('delete')"
          >
            <AppIcon name="delete" :size="14" class="text-(--color-text-muted)" />
          </button>
        </div>
      </Transition>
    </div>
  </div>
<!-- 图片放大预览 -->
<Teleport to="body">
  <div
    v-if="zoomImg"
    class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
    @click="zoomImg = null"
  >
    <img :src="zoomImg" class="max-w-full max-h-full rounded-xl object-contain shadow-2xl" />
  </div>
</Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
