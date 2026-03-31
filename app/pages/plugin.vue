<script setup lang="ts">
import { usePluginStore } from '~/stores/plugin'

definePageMeta({ layout: 'default' })

const pluginStore = usePluginStore()

const showAddModal = ref(false)
const newPluginContent = ref('')
const newPluginTitle = ref('')
const addError = ref('')

onMounted(() => pluginStore.load())

function addPlugin() {
  addError.value = ''
  try {
    JSON.parse(newPluginContent.value) // Validate JSON
    pluginStore.addPlugin(newPluginContent.value, newPluginTitle.value || undefined)
    showAddModal.value = false
    newPluginContent.value = ''
    newPluginTitle.value = ''
  } catch {
    addError.value = '无效的 OpenAPI JSON 格式'
  }
}

function getParsedInfo(content: string) {
  try {
    const parsed = JSON.parse(content)
    return { title: parsed.info?.title, version: parsed.info?.version }
  } catch { return { title: '未知', version: '' } }
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="flex items-center gap-3 px-6 py-4 border-b border-(--color-border) bg-(--color-bg)">
      <AppIcon name="plugin" :size="20" class="text-(--color-text-muted)" />
      <h1 class="text-base font-semibold text-(--color-text)">插件管理</h1>
      <div class="flex-1" />
      <AppButton variant="primary" icon="add" @click="showAddModal = true">添加插件</AppButton>
    </div>

    <!-- Plugin list -->
    <div class="flex-1 overflow-y-auto p-6">
      <p class="text-xs text-(--color-text-muted) mb-4">
        插件基于 OpenAPI 3.0 规范，允许 AI 访问外部工具和 API。
      </p>
      <div class="flex flex-col gap-3">
        <div
          v-for="plugin in pluginStore.allPlugins"
          :key="plugin.id"
          class="flex items-center gap-4 p-4 border border-(--color-border) rounded-xl hover:border-(--color-primary)/30 transition-colors"
        >
          <div class="w-10 h-10 rounded-lg bg-(--color-bg-secondary) flex items-center justify-center shrink-0">
            <AppIcon name="plugin" :size="18" class="text-(--color-primary)" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-(--color-text)">{{ plugin.title }}</p>
            <p class="text-xs text-(--color-text-muted)">
              {{ plugin.builtin ? '内置' : '自定义' }} · v{{ plugin.version }}
            </p>
          </div>
          <!-- Toggle -->
          <div class="flex items-center gap-2">
            <span class="text-xs text-(--color-text-muted)">{{ pluginStore.isEnabled(plugin.id) ? '已启用' : '已禁用' }}</span>
            <button
              class="w-10 h-6 rounded-full transition-colors relative"
              :class="pluginStore.isEnabled(plugin.id) ? 'bg-(--color-primary)' : 'bg-(--color-bg-tertiary)'"
              @click="pluginStore.togglePlugin(plugin.id)"
            >
              <span
                class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                :class="pluginStore.isEnabled(plugin.id) ? 'translate-x-4.5' : 'translate-x-0.5'"
              />
            </button>
            <button
              v-if="!plugin.builtin"
              class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 transition-colors"
              @click="pluginStore.removePlugin(plugin.id)"
            >
              <AppIcon name="delete" :size="14" class="text-(--color-text-muted)" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add plugin modal -->
    <AppModal
      v-model="showAddModal"
      title="添加插件（OpenAPI 3.0）"
      width="560px"
      @confirm="addPlugin"
    >
      <div class="flex flex-col gap-4">
        <AppInput v-model="newPluginTitle" label="插件名称（可选）" placeholder="我的插件" />
        <div>
          <label class="block text-xs font-medium text-(--color-text-secondary) mb-2">OpenAPI JSON 内容</label>
          <textarea
            v-model="newPluginContent"
            class="w-full border border-(--color-border) rounded-lg px-3 py-2 text-xs bg-(--color-bg) text-(--color-text) outline-none focus:border-(--color-primary)/50 resize-none font-mono"
            rows="10"
            placeholder='{"openapi":"3.0.0","info":{"title":"My Plugin","version":"1.0"},"paths":{}}'
          />
        </div>
        <p v-if="addError" class="text-xs text-red-500">{{ addError }}</p>
      </div>
    </AppModal>
  </div>
</template>
