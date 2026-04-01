<script setup lang="ts">
import { useChatStore } from '~/stores/chat'
import { useConfigStore } from '~/stores/config'
import { ALL_MODELS, PROVIDER_LIST } from '~/utils/models'
import type { ModelProvider } from '~/utils/types'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()

const chatStore = useChatStore()
const configStore = useConfigStore()
const { ollamaModels, loading: ollamaLoading, error: ollamaError, fetchModels } = useOllama()

const search = ref('')
const selectedProvider = ref<ModelProvider | 'all'>('all')

// 静态模型（非 Ollama）
const filteredModels = computed(() => {
  let models = ALL_MODELS.filter(m => m.provider.providerName !== 'Ollama')
  if (selectedProvider.value !== 'all' && selectedProvider.value !== 'Ollama') {
    models = models.filter(m => m.provider.providerName === selectedProvider.value)
  }
  if (selectedProvider.value === 'Ollama') models = []
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    models = models.filter(m =>
      m.name.toLowerCase().includes(q) ||
      (m.displayName || '').toLowerCase().includes(q),
    )
  }
  return models
})

// Ollama 动态模型（按搜索词过滤）
const filteredOllamaModels = computed(() => {
  if (selectedProvider.value !== 'all' && selectedProvider.value !== 'Ollama') return []
  const q = search.value.toLowerCase()
  return ollamaModels.value.filter(m =>
    !q || m.name.toLowerCase().includes(q),
  )
})

const currentModel = computed(() => chatStore.currentSession?.mask.modelConfig.model || configStore.currentModel)

function selectModel(name: string, provider: ModelProvider) {
  const sid = chatStore.currentSessionId
  if (sid) chatStore.updateSessionModelConfig(sid, { model: name, providerName: provider })
  configStore.setModel(name, provider)
  emit('update:modelValue', false)
}

// 打开时拉取 Ollama 模型列表
watch(() => props.modelValue, (open) => {
  if (open) fetchModels()
})
</script>

<template>
  <AppModal
    :model-value="modelValue"
    title="选择模型"
    width="480px"
    :footer="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- Search -->
    <AppInput
      v-model="search"
      placeholder="搜索模型..."
      clearable
      class="mb-3"
    />

    <!-- Provider filter -->
    <div class="flex gap-1.5 flex-wrap mb-4">
      <button
        class="px-2.5 py-1 rounded-full text-xs border transition-colors"
        :class="selectedProvider === 'all' ? 'bg-(--color-primary) text-white border-transparent' : 'border-(--color-border) text-(--color-text-secondary) hover:border-(--color-primary)/50'"
        @click="selectedProvider = 'all'"
      >全部</button>
      <button
        v-for="p in PROVIDER_LIST"
        :key="p"
        class="px-2.5 py-1 rounded-full text-xs border transition-colors"
        :class="selectedProvider === p ? 'bg-(--color-primary) text-white border-transparent' : 'border-(--color-border) text-(--color-text-secondary) hover:border-(--color-primary)/50'"
        @click="selectedProvider = p"
      >{{ p }}</button>
    </div>

    <!-- Model list -->
    <div class="flex flex-col gap-1 max-h-96 overflow-y-auto -mx-6 px-6">

      <!-- 静态模型 -->
      <button
        v-for="model in filteredModels"
        :key="model.name"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-(--color-bg-secondary) transition-colors text-left"
        :class="model.name === currentModel ? 'bg-(--color-primary-light) ring-1 ring-(--color-primary)/30' : ''"
        @click="selectModel(model.name, model.provider.providerName)"
      >
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-(--color-text) truncate">{{ model.displayName || model.name }}</p>
          <p class="text-xs text-(--color-text-muted)">{{ model.provider.providerName }}</p>
        </div>
        <AppIcon v-if="model.name === currentModel" name="confirm" :size="14" class="text-(--color-primary) shrink-0" />
      </button>

      <!-- Ollama 分组 -->
      <template v-if="selectedProvider === 'all' || selectedProvider === 'Ollama'">
        <div class="flex items-center gap-2 mt-3 mb-1 px-1">
          <span class="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wide">Ollama 本地模型</span>
          <span v-if="ollamaLoading" class="text-xs text-(--color-text-muted)">
            <AppIcon name="loading" :size="12" class="animate-spin" /> 加载中...
          </span>
          <span v-else-if="ollamaError" class="text-xs text-red-400">未连接</span>
          <span v-else class="text-xs text-(--color-text-muted)">{{ filteredOllamaModels.length }} 个</span>
        </div>

        <button
          v-for="model in filteredOllamaModels"
          :key="'ollama-' + model.name"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-(--color-bg-secondary) transition-colors text-left"
          :class="model.name === currentModel ? 'bg-(--color-primary-light) ring-1 ring-(--color-primary)/30' : ''"
          @click="selectModel(model.name, 'Ollama')"
        >
          <div class="w-6 h-6 rounded-md bg-(--color-primary-light) flex items-center justify-center shrink-0">
            <AppIcon name="bot" :size="12" class="text-(--color-primary)" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-(--color-text) truncate">{{ model.name }}</p>
            <p class="text-xs text-(--color-text-muted)">Ollama · 本地</p>
          </div>
          <AppIcon v-if="model.name === currentModel" name="confirm" :size="14" class="text-(--color-primary) shrink-0" />
        </button>

        <p v-if="!ollamaLoading && !ollamaError && filteredOllamaModels.length === 0" class="text-xs text-(--color-text-muted) px-3 py-2">
          未检测到已安装的 Ollama 模型，请先运行 <code class="bg-(--color-bg-secondary) px-1 rounded">ollama pull &lt;model&gt;</code>
        </p>
        <p v-if="ollamaError" class="text-xs text-red-400 px-3 py-2">
          ⚠ {{ ollamaError }} — 请确认 Ollama 正在运行
        </p>
      </template>

      <p v-if="!filteredModels.length && (selectedProvider !== 'all' && selectedProvider !== 'Ollama')"
        class="text-center py-6 text-sm text-(--color-text-muted)">没有找到匹配的模型</p>
    </div>
  </AppModal>
</template>
