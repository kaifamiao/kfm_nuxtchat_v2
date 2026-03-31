import { v4 as uuidv4 } from 'uuid'

export function createId(): string {
  return uuidv4()
}

export function createMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function now(): string {
  return new Date().toLocaleString('zh-CN')
}

export function nowMs(): number {
  return Date.now()
}

/** 截断字符串 */
export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str
}

/** 从消息列表中提取纯文本（用于生成标题等） */
export function getMessageText(content: string | unknown[]): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .filter((c: any) => c.type === 'text')
      .map((c: any) => c.text ?? '')
      .join('')
  }
  return ''
}

/** 深拷贝 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/** 复制到剪贴板 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
  } else {
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
}

/** 文件大小格式化 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** 简单计算 token 数（粗略估算） */
export function estimateTokens(text: string): number {
  // Chinese: 1 char ≈ 1.5 tokens; English: 1 word ≈ 1.3 tokens
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const otherChars = text.length - chineseChars
  return Math.ceil(chineseChars * 1.5 + otherChars * 0.25)
}

/** 去抖 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/** 将图片文件转为 base64 DataURL */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** 下载文本文件 */
export function downloadText(filename: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** 格式化日期 */
export function formatDate(date: Date | number): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

/** 生成随机颜色（用于 avatar） */
const AVATAR_COLORS = [
  '1F3A5F', '4A90D9', '5BA4A4', 'C9B1A3', '6A7FBD', 'A07FBD', 'BD7F7F',
]
export function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
}

/** 用于流式响应的读取器 */
export async function* streamReader(response: Response): AsyncGenerator<string> {
  const reader = response.body?.getReader()
  if (!reader) return
  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    yield decoder.decode(value, { stream: true })
  }
}

/** 解析 SSE 流的 data 字段 */
export function parseSSELine(line: string): string | null {
  if (line.startsWith('data: ')) {
    const data = line.slice(6).trim()
    if (data === '[DONE]') return null
    return data
  }
  return null
}
