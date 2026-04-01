// ─── Message ────────────────────────────────────────────────────────────────
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool'

export interface MessageContent {
  type: 'text' | 'image_url'
  text?: string
  image_url?: { url: string; detail?: 'auto' | 'low' | 'high' }
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string | MessageContent[]
  date: string
  streaming?: boolean
  isError?: boolean
  toolCallId?: string
  toolName?: string
  preview?: boolean
}

// ─── Session ─────────────────────────────────────────────────────────────────
export interface ChatSession {
  id: string
  topic: string
  messages: ChatMessage[]
  lastUpdate: number
  lastSummarizeIndex: number
  clearContextIndex?: number
  mask: Mask
  stat: {
    tokenCount: number
    wordCount: number
    charCount: number
  }
}

// ─── Mask ────────────────────────────────────────────────────────────────────
export interface Mask {
  id: string
  avatar: string
  name: string
  hideContext?: boolean
  context: ChatMessage[]
  syncGlobalConfig?: boolean
  modelConfig: ModelConfig
  lang?: string
  builtin?: boolean
  createdAt?: number
  plugin?: string[]
}

// ─── Model Config ─────────────────────────────────────────────────────────────
export interface ModelConfig {
  model: string
  providerName?: ModelProvider
  temperature?: number
  top_p?: number
  max_tokens?: number
  presence_penalty?: number
  frequency_penalty?: number
  sendMemory?: boolean
  historyMessageCount?: number
  compressMessageLengthThreshold?: number
  enableInjectSystemPrompts?: boolean
  template?: string
  size?: string
  quality?: string
  style?: string
  stream?: boolean
}

// ─── Provider ────────────────────────────────────────────────────────────────
export type ModelProvider =
  | 'OpenAI'
  | 'Azure'
  | 'Anthropic'
  | 'Google'
  | 'DeepSeek'
  | 'Alibaba'
  | 'ByteDance'
  | 'Baidu'
  | 'Iflytek'
  | 'Tencent'
  | 'Moonshot'
  | 'SiliconFlow'
  | 'XAI'
  | 'ChatGLM'
  | 'Stability'
  | '302AI'
  | 'Ollama'

export interface LLMModel {
  name: string
  displayName?: string
  available: boolean
  provider: { id: string; providerName: ModelProvider; providerType: string }
  sorted: number
}

// ─── Plugin ──────────────────────────────────────────────────────────────────
export interface Plugin {
  id: string
  createdAt: number
  title: string
  version: string
  content: string
  builtin: boolean
}

// ─── Sync ────────────────────────────────────────────────────────────────────
export type SyncType = 'upstash' | 'webdav' | 'googledrive'

export interface WebDavConfig {
  server: string
  username: string
  password: string
  filename: string
}

export interface UpstashConfig {
  endpoint: string
  username: string
  apiKey: string
}

// ─── Theme ───────────────────────────────────────────────────────────────────
export type ThemeMode = 'light' | 'dark' | 'auto'

// ─── Access ──────────────────────────────────────────────────────────────────
export interface AccessConfig {
  accessCode: string
  useCustomConfig: boolean
  provider: ModelProvider
  openaiUrl: string
  openaiApiKey: string
  anthropicUrl: string
  anthropicApiKey: string
  anthropicApiVersion: string
  googleUrl: string
  googleApiKey: string
  googleApiVersion: string
  azureUrl: string
  azureApiKey: string
  azureApiVersion: string
  deepseekUrl: string
  deepseekApiKey: string
  moonshotUrl: string
  moonshotApiKey: string
  alibabaUrl: string
  alibabaApiKey: string
  xaiApiKey: string
  xaiUrl: string
  siliconflowUrl: string
  siliconflowApiKey: string
  chatglmUrl: string
  chatglmApiKey: string
  bytedanceUrl: string
  bytedanceApiKey: string
  baiduUrl: string
  baiduApiKey: string
  // Ollama（本地，无需 API Key）
  ollamaUrl: string
}
