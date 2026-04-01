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

    <!-- Input area：统一容器，边框包裹整体 -->
    <div class="px-3 py-3 bg-(--color-bg) border-t border-(--color-border)">
      <div
        class="relative flex items-end gap-1 rounded-2xl border bg-(--color-bg-secondary) transition-colors"
        :class="disabled ? 'border-(--color-border)' : 'border-(--color-border) focus-within:border-(--color-primary)/60'"
      >
        <!-- 上传按钮：左下角，在框内 -->
        <label
          class="shrink-0 w-9 h-9 mb-2 ml-1 flex items-center justify-center rounded-xl cursor-pointer
                 hover:bg-(--color-bg-tertiary) active:bg-(--color-bg-tertiary) transition-colors"
        >
          <input type="file" accept="image/*" multiple class="hidden"
            @change="handleFileUpload(($event.target as HTMLInputElement).files)" />
          <AppIcon name="image" :size="17" class="text-(--color-text-muted)" />
        </label>

        <!-- Textarea：透明背景，无独立边框 -->
        <textarea
          ref="textareaRef"
          v-model="inputText"
          class="flex-1 bg-transparent py-3.5 pr-1 text-sm text-(--color-text) outline-none
                 resize-none placeholder:text-(--color-text-muted)
                 min-h-[52px] max-h-[160px] leading-[1.6]"
          placeholder="发送消息..."
          rows="1"
          :disabled="disabled"
          autocomplete="off"
          autocorrect="on"
          autocapitalize="sentences"
          enterkeyhint="send"
          @input="adjustHeight"
          @keydown="handleKeydown"
          @paste="pasteHandler"
        />

        <!-- 发送 / 停止按钮：右下角，在框内 -->
        <button
          class="shrink-0 w-8 h-8 mb-2 mr-1 flex items-center justify-center rounded-xl transition-all"
          :class="isGenerating
            ? 'bg-red-500 active:bg-red-600'
            : canSend
              ? 'bg-(--color-primary) active:bg-(--color-primary-hover)'
              : 'bg-(--color-bg-tertiary) cursor-not-allowed'"
          @click="isGenerating ? emit('stop') : send()"
        >
          <AppIcon
            :name="isGenerating ? 'speak-stop' : 'send-white'"
            :size="15"
            color="white"
          />
        </button>
      </div>
    </div>

    <!-- 快捷键提示：移动端隐藏（手机键盘没有 Shift+Enter） -->
    <div class="hidden sm:flex items-center justify-between px-4 pb-2 text-[11px] text-(--color-text-muted)">
      <span>{{ configStore.sendKey === 'Enter' ? 'Enter 发送，Shift+Enter 换行' : 'Shift+Enter 发送，Enter 换行' }}</span>
    </div>
    <!-- 移动端底部 safe area 垫高 -->
    <div class="sm:hidden" style="height: var(--safe-bottom, 0px)" />
  </div>
</template>
