<script setup lang="ts">
import { useConfigStore } from '~/stores/config'
import { fileToBase64 } from '~/utils/common'

const props = defineProps<{
  isGenerating?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  send: [content: string | any[]]
  stop: []
}>()

const configStore = useConfigStore()
const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement>()
const attachments = ref<Array<{ type: 'image'; url: string }>>([])
const isDragging = ref(false)

const canSend = computed(() => inputText.value.trim().length > 0 || attachments.value.length > 0)

function adjustHeight() {
  const ta = textareaRef.value
  if (!ta) return
  ta.style.height = 'auto'
  ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
}

function handleKeydown(e: KeyboardEvent) {
  const sendKey = configStore.sendKey
  if (sendKey === 'Enter' && e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  } else if (sendKey === 'Shift+Enter' && e.key === 'Enter' && e.shiftKey) {
    e.preventDefault()
    send()
  }
}

function send() {
  if (!canSend.value || props.isGenerating) return
  const text = inputText.value.trim()
  if (attachments.value.length > 0) {
    const content: any[] = []
    if (text) content.push({ type: 'text', text })
    attachments.value.forEach(att => {
      content.push({ type: 'image_url', image_url: { url: att.url } })
    })
    emit('send', content)
  } else {
    emit('send', text)
  }
  inputText.value = ''
  attachments.value = []
  nextTick(adjustHeight)
}

async function handleFileUpload(files: FileList | null) {
  if (!files) return
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) continue
    const url = await fileToBase64(file)
    attachments.value.push({ type: 'image', url })
  }
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  handleFileUpload(e.dataTransfer?.files || null)
}

function pasteHandler(e: ClipboardEvent) {
  const files = e.clipboardData?.files
  if (files?.length) {
    e.preventDefault()
    handleFileUpload(files)
  }
}

onMounted(() => textareaRef.value?.focus())
</script>

<template>
  <div
    class="relative"
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop.prevent="handleDrop"
  >
    <!-- Drag overlay -->
    <div
      v-if="isDragging"
      class="absolute inset-0 z-10 bg-(--color-primary)/10 border-2 border-dashed border-(--color-primary) rounded-2xl flex items-center justify-center"
    >
      <p class="text-(--color-primary) font-medium">拖放图片上传</p>
    </div>

    <!-- Attachments preview -->
    <div v-if="attachments.length" class="flex gap-2 px-4 pt-2 flex-wrap">
      <div
        v-for="(att, idx) in attachments"
        :key="idx"
        class="relative w-16 h-16 rounded-lg overflow-hidden border border-(--color-border)"
      >
        <img :src="att.url" class="w-full h-full object-cover" />
        <button
          class="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center"
          @click="attachments.splice(idx, 1)"
        >
          <AppIcon name="close" :size="8" color="white" />
        </button>
      </div>
    </div>

    <!-- Input area -->
    <div class="flex items-end gap-2 px-4 py-3 bg-(--color-bg) border-t border-(--color-border)">
      <!-- Upload button -->
      <label class="shrink-0 cursor-pointer">
        <input type="file" accept="image/*" multiple class="hidden" @change="handleFileUpload(($event.target as HTMLInputElement).files)" />
        <div class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-(--color-bg-secondary) transition-colors">
          <AppIcon name="image" :size="16" class="text-(--color-text-muted)" />
        </div>
      </label>

      <!-- Textarea -->
      <div class="flex-1 relative">
        <textarea
          ref="textareaRef"
          v-model="inputText"
          class="w-full bg-(--color-bg-secondary) rounded-xl px-4 py-2.5 text-sm text-(--color-text) outline-none resize-none placeholder:text-(--color-text-muted) min-h-[40px] max-h-[200px] border border-(--color-border) focus:border-(--color-primary)/50 transition-colors"
          placeholder="发送消息... (Enter 发送，Shift+Enter 换行)"
          rows="1"
          :disabled="disabled"
          @input="adjustHeight"
          @keydown="handleKeydown"
          @paste="pasteHandler"
        />
      </div>

      <!-- Send / Stop button -->
      <button
        class="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all"
        :class="isGenerating
          ? 'bg-red-500 hover:bg-red-600'
          : canSend
            ? 'bg-(--color-primary) hover:bg-(--color-primary-hover)'
            : 'bg-(--color-bg-tertiary) cursor-not-allowed'"
        @click="isGenerating ? emit('stop') : send()"
      >
        <AppIcon
          :name="isGenerating ? 'speak-stop' : 'send-white'"
          :size="16"
          color="white"
        />
      </button>
    </div>

    <!-- Hints -->
    <div class="flex items-center justify-between px-4 pb-2 text-[11px] text-(--color-text-muted)">
      <span>{{ configStore.sendKey === 'Enter' ? 'Enter 发送，Shift+Enter 换行' : 'Shift+Enter 发送，Enter 换行' }}</span>
    </div>
  </div>
</template>
