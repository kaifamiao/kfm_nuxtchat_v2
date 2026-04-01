<script setup lang="ts">
import { useChatStore } from '~/stores/chat'
import { useConfigStore } from '~/stores/config'
import { useChat } from '~/composables/useChat'
import { copyToClipboard, getMessageText } from '~/utils/common'

const chatStore = useChatStore()
const configStore = useConfigStore()
const { sendMessage, stopGenerating, isGenerating } = useChat()

const messagesEndRef = ref<HTMLDivElement>()
const toastRef = ref<{ success: (m: string) => void; error: (m: string) => void } | null>(null)
const showClearConfirm = ref(false)
const showModelSelector = ref(false)
const showExporter = ref(false)

const session = computed(() => chatStore.currentSession)
const messages = computed(() => session.value?.messages ?? [])
const currentModel = computed(() => session.value?.mask.modelConfig.model || configStore.currentModel)

// Auto-scroll to bottom on new messages
watch(messages, async () => {
  await nextTick()
  messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
}, { deep: true })

function handleSend(content: string | any[]) {
  if (!chatStore.currentSessionId) chatStore.newSession()
  sendMessage(typeof content === 'string' ? content : JSON.stringify(content))
}

function handleRetry() {
  const msgs = messages.value
  if (!msgs.length) return
  const lastUser = [...msgs].reverse().find(m => m.role === 'user')
  if (!lastUser) return
  const lastMsg = msgs[msgs.length - 1]
  if (lastMsg.role === 'assistant') {
    chatStore.deleteMessage(chatStore.currentSessionId, lastMsg.id)
  }
  sendMessage(typeof lastUser.content === 'string' ? lastUser.content : '')
}

function handleDeleteMessage(messageId: string) {
  chatStore.deleteMessage(chatStore.currentSessionId, messageId)
}

function clearMessages() {
  chatStore.clearMessages(chatStore.currentSessionId)
  showClearConfirm.value = false
}

// ── 分享：复制对话内容到剪贴板 ────────────────────────────────────────────────
async function shareConversation() {
  if (!session.value || !messages.value.length) {
    toastRef.value?.error('当前没有可分享的对话内容')
    return
  }
  const lines: string[] = [
    `📝 ${session.value.topic}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
  ]
  for (const msg of messages.value) {
    const role = msg.role === 'user' ? '👤 用户' : '🤖 助手'
    const text = getMessageText(msg.content)
    lines.push(`${role}：`, text, '')
  }
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`)
  lines.push(`由 NuxtChat 分享 · ${new Date().toLocaleString('zh-CN')}`)
  try {
    await copyToClipboard(lines.join('\n'))
    toastRef.value?.success('已复制到剪贴板，可直接粘贴分享')
  } catch {
    toastRef.value?.error('复制失败，请手动复制')
  }
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="flex items-center gap-3 px-4 h-[52px] border-b border-(--color-border) shrink-0 bg-(--color-bg)">
      <div class="flex-1 min-w-0">
        <h2 class="text-sm font-semibold text-(--color-text) truncate">
          {{ session?.topic || '新的对话' }}
        </h2>
        <p class="text-xs text-(--color-text-muted) truncate">
          {{ session?.messages.length ?? 0 }} 条消息
        </p>
      </div>

      <!-- Model selector button -->
      <button
        class="flex items-center gap-1.5 px-3 h-7 rounded-full border border-(--color-border) hover:border-(--color-primary)/50 text-xs text-(--color-text-secondary) hover:text-(--color-text) transition-all"
        @click="showModelSelector = true"
      >
        <AppIcon name="bot" :size="12" />
        {{ currentModel }}
        <AppIcon name="down" :size="10" />
      </button>

      <!-- Clear -->
      <button
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-(--color-bg-secondary) transition-colors"
        title="清除对话"
        @click="showClearConfirm = true"
      >
        <AppIcon name="clear" :size="16" class="text-(--color-text-muted)" />
      </button>

      <!-- Share：复制对话到剪贴板 -->
      <button
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-(--color-bg-secondary) transition-colors"
        title="分享对话（复制到剪贴板）"
        @click="shareConversation"
      >
        <AppIcon name="share" :size="16" class="text-(--color-text-muted)" />
      </button>

      <!-- Export：下载文件 -->
      <button
        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-(--color-bg-secondary) transition-colors"
        title="导出对话"
        @click="showExporter = true"
      >
        <AppIcon name="download" :size="16" class="text-(--color-text-muted)" />
      </button>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto py-4 scroll-smooth">
      <!-- Empty state -->
      <div v-if="!messages.length" class="flex flex-col items-center justify-center h-full gap-4 text-(--color-text-muted)">
        <AppIcon name="logo" :size="48" class="opacity-30" />
        <p class="text-sm">发送消息，开始对话</p>
        <p class="text-xs opacity-60">当前模型：{{ currentModel }}</p>
      </div>

      <template v-else>
        <ChatMessage
          v-for="(msg, idx) in messages"
          :key="msg.id"
          :message="msg"
          :is-last="idx === messages.length - 1"
          class="animate-fade-in"
          @retry="handleRetry"
          @delete="handleDeleteMessage(msg.id)"
        />
      </template>

      <div ref="messagesEndRef" class="h-1" />
    </div>

    <!-- Input -->
    <ChatInput
      :is-generating="isGenerating"
      @send="handleSend"
      @stop="stopGenerating"
    />

    <!-- Clear confirm modal -->
    <AppModal
      v-model="showClearConfirm"
      title="清除对话"
      width="380px"
      @confirm="clearMessages"
    >
      <p class="text-sm text-(--color-text)">确认清除所有消息？此操作不可撤销。</p>
    </AppModal>

    <!-- Model Selector Modal -->
    <ModelSelector v-model="showModelSelector" />

    <!-- Export Modal -->
    <AppModal
      v-model="showExporter"
      title="导出对话"
      width="360px"
      :footer="false"
    >
      <ConversationExporter @close="showExporter = false" />
    </AppModal>

    <!-- Local Toast（分享复制反馈） -->
    <AppToast ref="toastRef" />
  </div>
</template>
