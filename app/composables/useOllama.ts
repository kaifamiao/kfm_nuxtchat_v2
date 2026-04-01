import { useAccessStore } from '~/stores/access'
import type { LLMModel } from '~/utils/types'

export interface OllamaModelInfo {
  name: string
  modified_at: string
  size: number
  details?: {
    family: string
    parameter_size: string
    quantization_level: string
  }
}

/**
 * Ollama 模型管理 composable
 * 通过 Nitro 代理与本地 Ollama 服务通信
 */
export function useOllama() {
  const accessStore = useAccessStore()

  const models = ref<OllamaModelInfo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const connected = ref<boolean | null>(null) // null=未测试

  /** 拉取已安装的模型列表 */
  async function fetchModels() {
    loading.value = true
    error.value = null
    try {
      const resp = await fetch('/api/ollama/api/tags', {
        headers: { 'x-ollama-url': accessStore.ollamaUrl || 'http://localhost:11434' },
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json() as { models: OllamaModelInfo[] }
      models.value = data.models || []
      connected.value = true
    } catch (e: any) {
      error.value = e.message || '连接失败'
      connected.value = false
      models.value = []
    } finally {
      loading.value = false
    }
  }

  /** 测试连通性 */
  async function testConnection(): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const resp = await fetch('/api/ollama/api/tags', {
        headers: { 'x-ollama-url': accessStore.ollamaUrl || 'http://localhost:11434' },
      })
      connected.value = resp.ok
      if (!resp.ok) error.value = `HTTP ${resp.status}`
      else {
        const data = await resp.json() as { models: OllamaModelInfo[] }
        models.value = data.models || []
      }
      return resp.ok
    } catch (e: any) {
      error.value = e.message || '无法连接'
      connected.value = false
      return false
    } finally {
      loading.value = false
    }
  }

  /** 转换为统一的 LLMModel 格式 */
  const ollamaModels = computed<LLMModel[]>(() =>
    models.value.map(m => ({
      name: m.name,
      displayName: m.name,
      available: true,
      provider: { id: 'ollama', providerName: 'Ollama' as const, providerType: 'local' },
      sorted: 0,
    })),
  )

  return { models, ollamaModels, loading, error, connected, fetchModels, testConnection }
}
