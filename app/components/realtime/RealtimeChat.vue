<script setup lang="ts">
/**
 * 实时语音对话组件
 * 基于浏览器 Web Speech API（SpeechRecognition + SpeechSynthesis）
 * 对接 OpenAI GPT-4o 实时对话
 */
import { useChatStore } from '~/stores/chat'
import { useAccessStore } from '~/stores/access'

const emit = defineEmits<{ close: [] }>()

const chatStore = useChatStore()
const accessStore = useAccessStore()

type RealtimeStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'
const status = ref<RealtimeStatus>('idle')
const transcript = ref('')
const response = ref('')
const errorMsg = ref('')

let recognition: any = null
let speechSynthesis: SpeechSynthesis | null = null

const statusLabel: Record<RealtimeStatus, string> = {
  idle: '点击麦克风开始',
  listening: '正在听...',
  processing: '思考中...',
  speaking: 'AI 正在说话...',
  error: '发生错误',
}

const statusColor: Record<RealtimeStatus, string> = {
  idle: 'text-(--color-text-muted)',
  listening: 'text-red-500',
  processing: 'text-(--color-primary)',
  speaking: 'text-green-500',
  error: 'text-red-500',
}

function initSpeechRecognition() {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognition) {
    errorMsg.value = '您的浏览器不支持语音识别'
    status.value = 'error'
    return null
  }
  const rec = new SpeechRecognition()
  rec.continuous = false
  rec.interimResults = true
  rec.lang = 'zh-CN'

  rec.onresult = (event: any) => {
    const result = event.results[event.results.length - 1]
    transcript.value = result[0].transcript
    if (result.isFinal) processTranscript(transcript.value)
  }

  rec.onend = () => {
    if (status.value === 'listening') status.value = 'processing'
  }

  rec.onerror = (event: any) => {
    errorMsg.value = `语音识别错误: ${event.error}`
    status.value = 'error'
  }

  return rec
}

async function processTranscript(text: string) {
  if (!text.trim()) { status.value = 'idle'; return }
  status.value = 'processing'

  try {
    // Send to chat via streaming
    const sid = chatStore.currentSessionId
    const userMsg = chatStore.createUserMessage(text)
    chatStore.addMessage(sid, userMsg)
    const assistantMsg = chatStore.createAssistantMessage()
    chatStore.addMessage(sid, assistantMsg)

    // Simple fetch to OpenAI
    const apiKey = accessStore.openaiApiKey
    const resp = await fetch('/api/openai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: text }],
        stream: false,
        accessCode: accessStore.accessCode,
      }),
    })

    const data = await resp.json()
    const aiText = data.choices?.[0]?.message?.content || ''
    response.value = aiText

    chatStore.updateLastMessage(sid, msg => {
      msg.content = aiText
      msg.streaming = false
    })

    // TTS
    speakText(aiText)
  } catch (e: any) {
    errorMsg.value = e.message
    status.value = 'error'
  }
}

function speakText(text: string) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = 1.0
  status.value = 'speaking'
  utterance.onend = () => { status.value = 'idle'; transcript.value = ''; response.value = '' }
  window.speechSynthesis.speak(utterance)
}

function startListening() {
  errorMsg.value = ''
  if (!recognition) recognition = initSpeechRecognition()
  if (!recognition) return
  status.value = 'listening'
  transcript.value = ''
  recognition.start()
}

function stopListening() {
  recognition?.stop()
  if (status.value === 'speaking') {
    window.speechSynthesis?.cancel()
    status.value = 'idle'
  }
}

onUnmounted(() => {
  recognition?.stop()
  window.speechSynthesis?.cancel()
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div class="bg-(--color-bg) rounded-3xl p-8 flex flex-col items-center gap-6 w-80 shadow-2xl">
      <!-- Close -->
      <div class="flex items-center justify-between w-full">
        <h3 class="text-base font-semibold text-(--color-text)">实时语音对话</h3>
        <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-(--color-bg-secondary)" @click="emit('close')">
          <AppIcon name="close" :size="14" />
        </button>
      </div>

      <!-- Mic button -->
      <button
        class="w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg"
        :class="[
          status === 'listening' ? 'bg-red-500 scale-110 animate-pulse' :
          status === 'processing' ? 'bg-(--color-primary) scale-105' :
          status === 'speaking' ? 'bg-green-500' :
          'bg-(--color-bg-secondary) hover:bg-(--color-bg-tertiary)'
        ]"
        @click="status === 'idle' || status === 'error' ? startListening() : stopListening()"
      >
        <AppIcon
          :name="status === 'listening' ? 'speak-stop' : status === 'speaking' ? 'voice' : 'speak'"
          :size="28"
          :color="['listening', 'processing', 'speaking'].includes(status) ? 'white' : 'var(--color-text-muted)'"
        />
      </button>

      <!-- Status -->
      <p class="text-sm font-medium" :class="statusColor[status]">{{ statusLabel[status] }}</p>

      <!-- Transcript -->
      <div v-if="transcript || response" class="w-full text-sm text-(--color-text) text-center">
        <p v-if="transcript" class="text-(--color-text-secondary)">{{ transcript }}</p>
        <p v-if="response" class="mt-2 text-(--color-text)">{{ response }}</p>
      </div>

      <!-- Error -->
      <p v-if="errorMsg" class="text-xs text-red-500 text-center">{{ errorMsg }}</p>

      <p class="text-xs text-(--color-text-muted) text-center">
        基于 Web Speech API<br />
        支持中文和英文识别
      </p>
    </div>
  </div>
</template>
