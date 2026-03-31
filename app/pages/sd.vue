<script setup lang="ts">
import { useSDStore } from '~/stores/sd'

definePageMeta({ layout: 'default' })

const sdStore = useSDStore()
const prompt = ref('')
const isGenerating = ref(false)
const error = ref('')

async function generate() {
  if (!prompt.value.trim() || isGenerating.value) return
  error.value = ''
  isGenerating.value = true
  try {
    await sdStore.generate(prompt.value.trim())
    prompt.value = ''
  } catch (e: any) {
    error.value = e.message || '生成失败'
  } finally {
    isGenerating.value = false
  }
}

function downloadImage(url: string, idx: number) {
  const a = document.createElement('a')
  a.href = url
  a.download = `sd-image-${idx}.png`
  a.click()
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="flex items-center gap-3 px-6 py-4 border-b border-(--color-border) bg-(--color-bg) shrink-0">
      <AppIcon name="sd" :size="20" class="text-(--color-text-muted)" />
      <h1 class="text-base font-semibold text-(--color-text)">Stable Diffusion</h1>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <!-- Left: Config + Input -->
      <div class="w-72 shrink-0 flex flex-col border-r border-(--color-border) p-4 gap-4 overflow-y-auto">
        <div>
          <label class="block text-xs font-medium text-(--color-text-secondary) mb-1">API Key</label>
          <AppInput
            :model-value="sdStore.config.apiKey"
            type="password"
            placeholder="Stability AI API Key"
            @update:model-value="sdStore.updateConfig({ apiKey: $event })"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-(--color-text-secondary) mb-1">模型</label>
          <select
            class="w-full border border-(--color-border) rounded-lg px-3 py-2 text-sm bg-(--color-bg) text-(--color-text) outline-none"
            :value="sdStore.config.model"
            @change="sdStore.updateConfig({ model: ($event.target as HTMLSelectElement).value })"
          >
            <option value="stable-diffusion-xl-1024-v1-0">SDXL 1.0</option>
            <option value="stable-diffusion-v1-6">SD 1.6</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium text-(--color-text-secondary) mb-1">尺寸</label>
          <div class="flex gap-2">
            <input type="number" :value="sdStore.config.width" min="512" max="2048" step="64"
              class="flex-1 border border-(--color-border) rounded px-2 py-1.5 text-sm bg-(--color-bg) text-(--color-text) outline-none"
              @change="sdStore.updateConfig({ width: +($event.target as HTMLInputElement).value })" />
            <span class="text-(--color-text-muted) self-center">×</span>
            <input type="number" :value="sdStore.config.height" min="512" max="2048" step="64"
              class="flex-1 border border-(--color-border) rounded px-2 py-1.5 text-sm bg-(--color-bg) text-(--color-text) outline-none"
              @change="sdStore.updateConfig({ height: +($event.target as HTMLInputElement).value })" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-(--color-text-secondary) mb-1">Steps：{{ sdStore.config.steps }}</label>
          <input type="range" min="10" max="50" :value="sdStore.config.steps" class="w-full accent-(--color-primary)"
            @input="sdStore.updateConfig({ steps: +($event.target as HTMLInputElement).value })" />
        </div>

        <div>
          <label class="block text-xs font-medium text-(--color-text-secondary) mb-1">负向提示词</label>
          <textarea
            :value="sdStore.config.negativePrompt"
            rows="3"
            class="w-full border border-(--color-border) rounded-lg px-3 py-2 text-xs bg-(--color-bg) text-(--color-text) outline-none resize-none"
            @input="sdStore.updateConfig({ negativePrompt: ($event.target as HTMLTextAreaElement).value })"
          />
        </div>
      </div>

      <!-- Right: Gallery + Input -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Gallery -->
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="!sdStore.recentTasks.length" class="flex flex-col items-center justify-center h-full gap-3 text-(--color-text-muted)">
            <AppIcon name="image" :size="48" class="opacity-30" />
            <p class="text-sm">在下方输入提示词生成图像</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="(task, idx) in sdStore.recentTasks"
              :key="task.id"
              class="border border-(--color-border) rounded-xl overflow-hidden"
            >
              <div v-if="task.status === 'loading'" class="aspect-square bg-(--color-bg-secondary) flex items-center justify-center">
                <div class="w-8 h-8 border-2 border-(--color-primary) border-t-transparent rounded-full animate-spin" />
              </div>
              <img v-else-if="task.status === 'success' && task.imageUrl"
                :src="task.imageUrl" :alt="task.prompt" class="w-full aspect-square object-cover" />
              <div v-else class="aspect-square bg-red-50 flex items-center justify-center p-4">
                <p class="text-xs text-red-500 text-center">{{ task.error }}</p>
              </div>
              <div class="p-2">
                <p class="text-xs text-(--color-text) line-clamp-2">{{ task.prompt }}</p>
                <div class="flex items-center justify-between mt-1">
                  <span class="text-[10px] text-(--color-text-muted)">{{ task.width }}×{{ task.height }}</span>
                  <div class="flex gap-1">
                    <button v-if="task.imageUrl" class="w-6 h-6 flex items-center justify-center rounded hover:bg-(--color-bg-secondary)"
                      @click="downloadImage(task.imageUrl!, idx)">
                      <AppIcon name="download" :size="12" class="text-(--color-text-muted)" />
                    </button>
                    <button class="w-6 h-6 flex items-center justify-center rounded hover:bg-red-100"
                      @click="sdStore.removeTask(task.id)">
                      <AppIcon name="delete" :size="12" class="text-(--color-text-muted)" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Prompt input -->
        <div class="border-t border-(--color-border) p-4 flex gap-3">
          <textarea
            v-model="prompt"
            rows="2"
            class="flex-1 border border-(--color-border) rounded-xl px-4 py-2.5 text-sm text-(--color-text) bg-(--color-bg-secondary) outline-none resize-none placeholder:text-(--color-text-muted)"
            placeholder="描述你想要生成的图像，例如：a beautiful sunset over the ocean, realistic, 4K..."
            @keydown.ctrl.enter="generate"
          />
          <AppButton
            variant="primary"
            :loading="isGenerating"
            class="self-end"
            @click="generate"
          >
            生成
          </AppButton>
        </div>
        <p v-if="error" class="px-4 pb-2 text-xs text-red-500">{{ error }}</p>
      </div>
    </div>
  </div>
</template>
