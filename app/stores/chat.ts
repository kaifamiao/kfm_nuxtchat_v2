import { defineStore } from 'pinia'
import { db, DB_KEYS } from '~/utils/db'
import type { ChatSession, ChatMessage, Mask, ModelConfig } from '~/utils/types'
import { createId, createMessageId, now, nowMs } from '~/utils/common'
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from '~/utils/models'

const DEFAULT_MASK: Mask = {
  id: 'default',
  avatar: 'Bot',
  name: '新对话',
  context: [],
  modelConfig: {
    model: DEFAULT_MODEL,
    providerName: DEFAULT_PROVIDER,
    temperature: 0.5,
    max_tokens: 4096,
    sendMemory: true,
    historyMessageCount: 10,
    stream: true,
  },
  builtin: true,
}

function createSession(mask?: Partial<Mask>): ChatSession {
  return {
    id: createId(),
    topic: '新的对话',
    messages: [],
    lastUpdate: nowMs(),
    lastSummarizeIndex: 0,
    mask: { ...DEFAULT_MASK, ...mask },
    stat: { tokenCount: 0, wordCount: 0, charCount: 0 },
  }
}

interface ChatState {
  sessions: ChatSession[]
  currentSessionId: string
  isGenerating: boolean
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    sessions: [],
    currentSessionId: '',
    isGenerating: false,
  }),

  getters: {
    currentSession: (state): ChatSession | undefined =>
      state.sessions.find(s => s.id === state.currentSessionId),

    sortedSessions: (state): ChatSession[] =>
      [...state.sessions].sort((a, b) => b.lastUpdate - a.lastUpdate),

    currentMessages: (state): ChatMessage[] =>
      state.sessions.find(s => s.id === state.currentSessionId)?.messages ?? [],
  },

  actions: {
    async load() {
      const saved = await db.get<ChatState>(DB_KEYS.CHAT_STORE)
      if (saved?.sessions?.length) {
        this.sessions = saved.sessions
        this.currentSessionId = saved.currentSessionId || saved.sessions[0].id
      } else {
        this.newSession()
      }
    },

    async save() {
      await db.set(DB_KEYS.CHAT_STORE, {
        sessions: this.sessions,
        currentSessionId: this.currentSessionId,
      })
    },

    newSession(mask?: Partial<Mask>): ChatSession {
      const session = createSession(mask)
      this.sessions.unshift(session)
      this.currentSessionId = session.id
      this.save()
      return session
    },

    deleteSession(id: string) {
      const idx = this.sessions.findIndex(s => s.id === id)
      if (idx < 0) return
      this.sessions.splice(idx, 1)
      if (this.currentSessionId === id) {
        this.currentSessionId = this.sessions[0]?.id ?? this.newSession().id
      }
      this.save()
    },

    selectSession(id: string) {
      this.currentSessionId = id
      this.save()
    },

    renameSession(id: string, topic: string) {
      const session = this.sessions.find(s => s.id === id)
      if (session) { session.topic = topic; this.save() }
    },

    addMessage(sessionId: string, message: ChatMessage) {
      const session = this.sessions.find(s => s.id === sessionId)
      if (!session) return
      session.messages.push(message)
      session.lastUpdate = nowMs()
      this.save()
    },

    // 流式追加内容：只更新内存，不写 IndexedDB（高频调用安全）
    appendStreamContent(sessionId: string, content: string) {
      const session = this.sessions.find(s => s.id === sessionId)
      if (!session || !session.messages.length) return
      session.messages[session.messages.length - 1].content = content
    },

    // 最终更新消息并持久化（流式结束、错误、停止时调用）
    async updateLastMessage(sessionId: string, updater: (msg: ChatMessage) => void) {
      const session = this.sessions.find(s => s.id === sessionId)
      if (!session || !session.messages.length) return
      updater(session.messages[session.messages.length - 1])
      await this.save()
    },

    deleteMessage(sessionId: string, messageId: string) {
      const session = this.sessions.find(s => s.id === sessionId)
      if (!session) return
      session.messages = session.messages.filter(m => m.id !== messageId)
      this.save()
    },

    clearMessages(sessionId: string) {
      const session = this.sessions.find(s => s.id === sessionId)
      if (session) { session.messages = []; this.save() }
    },

    updateSessionModelConfig(sessionId: string, config: Partial<ModelConfig>) {
      const session = this.sessions.find(s => s.id === sessionId)
      if (session) {
        session.mask.modelConfig = { ...session.mask.modelConfig, ...config }
        this.save()
      }
    },

    createUserMessage(content: string): ChatMessage {
      return { id: createMessageId(), role: 'user', content, date: now() }
    },

    createAssistantMessage(content = ''): ChatMessage {
      return { id: createMessageId(), role: 'assistant', content, date: now(), streaming: true }
    },
  },
})
