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
    class="group flex gap-3 px-4 py-4 hover:bg-(--color-bg-secondary)/50 transition-colors rounded-2xl mx-2"
    :class="isUser ? 'flex-row-reverse' : 'flex-row'"
    @mouseenter="showActions = true"
    @mouseleave="showActions = false"
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
        <!-- Streaming indicator -->
        <template v-if="message.streaming">
          <MarkdownRenderer :content="contentText" />
          <span class="typing-cursor" />
        </template>
        <MarkdownRenderer v-else :content="contentText" />
      </div>

      <!-- Timestamp -->
      <span class="text-[11px] text-(--color-text-muted) mt-1 px-1">{{ message.date }}</span>

      <!-- Action buttons -->
      <Transition name="fade">
        <div
          v-if="showActions && !message.streaming"
          class="flex items-center gap-1 mt-1"
          :class="isUser ? 'flex-row-reverse' : ''"
        >
          <button
            class="w-6 h-6 flex items-center justify-center rounded hover:bg-(--color-bg-tertiary) transition-colors"
            :title="isCopied ? '已复制' : '复制'"
            @click="copy"
          >
            <AppIcon :name="isCopied ? 'confirm' : 'copy'" :size="12" class="text-(--color-text-muted)" />
          </button>
          <button
            v-if="!isUser && isLast"
            class="w-6 h-6 flex items-center justify-center rounded hover:bg-(--color-bg-tertiary) transition-colors"
            title="重新生成"
            @click="emit('retry')"
          >
            <AppIcon name="reload" :size="12" class="text-(--color-text-muted)" />
          </button>
          <button
            class="w-6 h-6 flex items-center justify-center rounded hover:bg-red-100 transition-colors"
            title="删除"
            @click="emit('delete')"
          >
            <AppIcon name="delete" :size="12" class="text-(--color-text-muted)" />
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
