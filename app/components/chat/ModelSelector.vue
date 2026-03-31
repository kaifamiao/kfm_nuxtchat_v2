<script setup lang="ts">
import { useChatStore } from '~/stores/chat'
import { useConfigStore } from '~/stores/config'
import { ALL_MODELS, PROVIDER_LIST } from '~/utils/models'
import type { ModelProvider } from '~/utils/types'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()

const chatStore = useChatStore()
const configStore = useConfigStore()

const search = ref('')
const selectedProvider = ref<ModelProvider | 'all'>('all')

const filteredModels = computed(() => {
  let models = ALL_MODELS
  if (selectedProvider.value !== 'all') {
    models = models.filter(m => m.provider.providerName === selectedProvider.value)
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    models = models.filter(m =>
      m.name.toLowerCase().includes(q) ||
      (m.displayName || '').toLowerCase().includes(q)
    )
  }
  return models
})

const currentModel = computed(() => chatStore.currentSession?.mask.modelConfig.model || configStore.currentModel)

function selectModel(name: string, provider: ModelProvider) {
  const sid = chatStore.currentSessionId
  if (sid) chatStore.updateSessionModelConfig(sid, { model: name, providerName: provider })
  configStore.setModel(name, provider)
  emit('update:modelValue', false)
}
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
    <div class="flex flex-col gap-1 max-h-80 overflow-y-auto -mx-6 px-6">
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
      <p v-if="!filteredModels.length" class="text-center py-6 text-sm text-(--color-text-muted)">没有找到匹配的模型</p>
    </div>
  </AppModal>
</template>
