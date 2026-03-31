<script setup lang="ts">
import { useChatStore } from '~/stores/chat'
import { downloadText, getMessageText } from '~/utils/common'
import type { ChatSession } from '~/utils/types'

const props = defineProps<{ session?: ChatSession }>()
const emit = defineEmits<{ close: [] }>()

const chatStore = useChatStore()
const session = computed(() => props.session || chatStore.currentSession)

function exportMarkdown() {
  if (!session.value) return
  const lines = [`# ${session.value.topic}`, '', `> 导出时间：${new Date().toLocaleString('zh-CN')}`, '']
  for (const msg of session.value.messages) {
    const text = getMessageText(msg.content)
    lines.push(`## ${msg.role === 'user' ? '👤 用户' : '🤖 助手'}`, '', text, '')
  }
  downloadText(`${session.value.topic}.md`, lines.join('\n'), 'text/markdown')
  emit('close')
}

function exportJSON() {
  if (!session.value) return
  downloadText(
    `${session.value.topic}.json`,
    JSON.stringify(session.value, null, 2),
    'application/json',
  )
  emit('close')
}

function exportText() {
  if (!session.value) return
  const lines: string[] = [`${session.value.topic}\n${'='.repeat(40)}\n`]
  for (const msg of session.value.messages) {
    const role = msg.role === 'user' ? '用户' : '助手'
    const text = getMessageText(msg.content)
    lines.push(`[${role}] ${msg.date}\n${text}\n`)
  }
  downloadText(`${session.value.topic}.txt`, lines.join('\n'))
  emit('close')
}
</script>

<template>
  <div class="flex flex-col gap-3 p-4 min-w-[220px]">
    <p class="text-xs font-semibold text-(--color-text-secondary) mb-1">导出对话</p>
    <button
      class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-(--color-bg-secondary) transition-colors text-left"
      @click="exportMarkdown"
    >
      <AppIcon name="export" :size="16" class="text-(--color-primary)" />
      <div>
        <p class="text-sm text-(--color-text)">导出为 Markdown</p>
        <p class="text-xs text-(--color-text-muted)">.md 文件</p>
      </div>
    </button>
    <button
      class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-(--color-bg-secondary) transition-colors text-left"
      @click="exportJSON"
    >
      <AppIcon name="download" :size="16" class="text-(--color-primary)" />
      <div>
        <p class="text-sm text-(--color-text)">导出为 JSON</p>
        <p class="text-xs text-(--color-text-muted)">.json 文件（含元数据）</p>
      </div>
    </button>
    <button
      class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-(--color-bg-secondary) transition-colors text-left"
      @click="exportText"
    >
      <AppIcon name="copy" :size="16" class="text-(--color-primary)" />
      <div>
        <p class="text-sm text-(--color-text)">导出为纯文本</p>
        <p class="text-xs text-(--color-text-muted)">.txt 文件</p>
      </div>
    </button>
  </div>
</template>
