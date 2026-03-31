import { defineStore } from 'pinia'
import { db, DB_KEYS } from '~/utils/db'
import type { Mask } from '~/utils/types'
import { createId, nowMs } from '~/utils/common'
import { DEFAULT_MODEL, DEFAULT_PROVIDER } from '~/utils/models'

// 内置 Mask 预设
const BUILTIN_MASKS: Mask[] = [
  {
    id: 'builtin-1',
    avatar: '🤖',
    name: 'AI 助手',
    builtin: true,
    context: [
      {
        id: 'sys-1',
        role: 'system',
        content: '你是一个有帮助、诚实、无害的 AI 助手。',
        date: '',
      },
    ],
    modelConfig: { model: DEFAULT_MODEL, providerName: DEFAULT_PROVIDER, temperature: 0.5 },
  },
  {
    id: 'builtin-2',
    avatar: '👨‍💻',
    name: '代码专家',
    builtin: true,
    context: [
      {
        id: 'sys-2',
        role: 'system',
        content: '你是一位专业的软件工程师，擅长各种编程语言和软件架构。在回答问题时，请提供清晰、高效、可维护的代码示例，并解释关键概念。',
        date: '',
      },
    ],
    modelConfig: { model: DEFAULT_MODEL, providerName: DEFAULT_PROVIDER, temperature: 0.2 },
  },
  {
    id: 'builtin-3',
    avatar: '📝',
    name: '写作助手',
    builtin: true,
    context: [
      {
        id: 'sys-3',
        role: 'system',
        content: '你是一位专业的写作助手，能够帮助用户撰写、修改和改进各类文章、报告、邮件等文字内容。',
        date: '',
      },
    ],
    modelConfig: { model: DEFAULT_MODEL, providerName: DEFAULT_PROVIDER, temperature: 0.8 },
  },
  {
    id: 'builtin-4',
    avatar: '🌍',
    name: '翻译专家',
    builtin: true,
    context: [
      {
        id: 'sys-4',
        role: 'system',
        content: '你是一位专业翻译，精通中、英、日、韩、法、德、西等语言。请提供准确、自然、符合目标语言习惯的翻译。',
        date: '',
      },
    ],
    modelConfig: { model: DEFAULT_MODEL, providerName: DEFAULT_PROVIDER, temperature: 0.3 },
  },
  {
    id: 'builtin-5',
    avatar: '🔬',
    name: '学术研究助手',
    builtin: true,
    context: [
      {
        id: 'sys-5',
        role: 'system',
        content: '你是一位学术研究助手，能够帮助用户进行文献综述、研究方法设计、数据分析和学术写作。请引用可靠来源并保持学术严谨性。',
        date: '',
      },
    ],
    modelConfig: { model: DEFAULT_MODEL, providerName: DEFAULT_PROVIDER, temperature: 0.4 },
  },
]

interface MaskState {
  masks: Mask[]
}

export const useMaskStore = defineStore('mask', {
  state: (): MaskState => ({ masks: [] }),

  getters: {
    allMasks: (state): Mask[] => [...BUILTIN_MASKS, ...state.masks],
    customMasks: (state): Mask[] => state.masks,
  },

  actions: {
    async load() {
      const saved = await db.get<MaskState>(DB_KEYS.MASK_STORE)
      if (saved?.masks) this.masks = saved.masks
    },

    async save() {
      await db.set(DB_KEYS.MASK_STORE, { masks: this.masks })
    },

    create(mask: Partial<Mask>): Mask {
      const newMask: Mask = {
        id: createId(),
        avatar: '🤖',
        name: '新建 Mask',
        context: [],
        modelConfig: { model: DEFAULT_MODEL, providerName: DEFAULT_PROVIDER },
        builtin: false,
        createdAt: nowMs(),
        ...mask,
      }
      this.masks.push(newMask)
      this.save()
      return newMask
    },

    update(id: string, updater: (mask: Mask) => void) {
      const mask = this.masks.find(m => m.id === id)
      if (mask) { updater(mask); this.save() }
    },

    delete(id: string) {
      this.masks = this.masks.filter(m => m.id !== id)
      this.save()
    },

    getById(id: string): Mask | undefined {
      return this.allMasks.find(m => m.id === id)
    },
  },
})
