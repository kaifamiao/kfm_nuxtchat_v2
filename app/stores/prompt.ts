import { defineStore } from 'pinia'
import { db, DB_KEYS } from '~/utils/db'
import { createId } from '~/utils/common'

export interface Prompt {
  id: string
  title: string
  content: string
  isUser?: boolean
}

const BUILTIN_PROMPTS: Prompt[] = [
  { id: 'b1', title: '简洁回答', content: '请用简洁明了的语言回答，避免冗长。' },
  { id: 'b2', title: '详细解释', content: '请详细解释，包括背景、原因、步骤和示例。' },
  { id: 'b3', title: '角色扮演', content: '你现在扮演以下角色：' },
  { id: 'b4', title: '总结文章', content: '请总结以下内容，提取关键信息：' },
  { id: 'b5', title: '润色文字', content: '请帮我润色以下文字，使其更加流畅自然：' },
  { id: 'b6', title: '代码审查', content: '请审查以下代码，指出问题并提供改进建议：' },
  { id: 'b7', title: '中英互译', content: '请将以下内容翻译成英文（如果是英文则翻译成中文）：' },
  { id: 'b8', title: '头脑风暴', content: '请围绕以下主题进行头脑风暴，列出尽可能多的创意：' },
]

interface PromptState {
  prompts: Prompt[]
  searchText: string
}

export const usePromptStore = defineStore('prompt', {
  state: (): PromptState => ({
    prompts: [],
    searchText: '',
  }),

  getters: {
    allPrompts: (state): Prompt[] => [...BUILTIN_PROMPTS, ...state.prompts],

    filteredPrompts: (state): Prompt[] => {
      const all = [...BUILTIN_PROMPTS, ...state.prompts]
      const q = state.searchText.toLowerCase().trim()
      if (!q) return all
      return all.filter(p =>
        p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q),
      )
    },
  },

  actions: {
    async load() {
      const saved = await db.get<PromptState>(DB_KEYS.PROMPT_STORE)
      if (saved?.prompts) this.prompts = saved.prompts
    },

    async save() {
      await db.set(DB_KEYS.PROMPT_STORE, { prompts: this.prompts })
    },

    add(title: string, content: string): Prompt {
      const prompt: Prompt = { id: createId(), title, content, isUser: true }
      this.prompts.push(prompt)
      this.save()
      return prompt
    },

    update(id: string, data: Partial<Prompt>) {
      const prompt = this.prompts.find(p => p.id === id)
      if (prompt) { Object.assign(prompt, data); this.save() }
    },

    remove(id: string) {
      this.prompts = this.prompts.filter(p => p.id !== id)
      this.save()
    },

    search(text: string) {
      this.searchText = text
    },
  },
})
