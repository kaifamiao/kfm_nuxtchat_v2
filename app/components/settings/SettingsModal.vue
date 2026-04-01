<script setup lang="ts">
import { useConfigStore, DEFAULT_COLORS_LIGHT, DEFAULT_COLORS_DARK } from '~/stores/config'
import { useAccessStore } from '~/stores/access'
import { useSyncStore } from '~/stores/sync'
import type { ThemeMode } from '~/utils/types'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()

const configStore = useConfigStore()
const accessStore = useAccessStore()
const syncStore = useSyncStore()
const { connected: ollamaConnected, loading: ollamaLoading, error: ollamaError,
        models: ollamaModels, testConnection: testOllama } = useOllama()

type Tab = 'general' | 'model' | 'access' | 'sync' | 'about'
const activeTab = ref<Tab>('general')

const tabs: Array<{ key: Tab; label: string; icon: string }> = [
  { key: 'general', label: '通用', icon: 'settings' },
  { key: 'model', label: '模型', icon: 'bot' },
  { key: 'access', label: 'API 密钥', icon: 'eye-off' },
  { key: 'sync', label: '数据同步', icon: 'cloud-success' },
  { key: 'about', label: '关于', icon: 'brain' },
]

const themes: Array<{ value: ThemeMode; label: string; icon: string }> = [
  { value: 'light', label: '浅色', icon: 'light' },
  { value: 'dark', label: '深色', icon: 'dark' },
  { value: 'auto', label: '跟随系统', icon: 'auto' },
]

function setTheme(theme: ThemeMode) { configStore.setTheme(theme) }

// 配色：当前实际生效的色值（优先用自定义，否则用主题默认）
const defaultColors = computed(() =>
  configStore.isDark ? DEFAULT_COLORS_DARK : DEFAULT_COLORS_LIGHT,
)

const colorItems = computed(() => [
  { key: 'sidebar' as const,              label: '侧边栏背景',     desc: '左侧导航区底色' },
  { key: 'chatHistory' as const,          label: '历史记录高亮',   desc: '选中的对话条目颜色' },
  { key: 'chatArea' as const,             label: '主对话区背景',   desc: '消息列表区域底色' },
  { key: 'userBubble' as const,           label: '用户气泡背景',   desc: '你发送的消息气泡底色' },
  { key: 'userBubbleText' as const,       label: '用户气泡字体',   desc: '你发送的消息文字颜色' },
  { key: 'assistantBubble' as const,      label: '助理气泡背景',   desc: 'AI 回复的气泡底色' },
  { key: 'assistantBubbleText' as const,  label: '助理气泡字体',   desc: 'AI 回复的文字颜色' },
])

type ColorKey = keyof typeof configStore.customColors

function getColor(key: ColorKey): string {
  return configStore.customColors[key] || defaultColors.value[key]
}

function setColor(key: ColorKey, val: string) {
  configStore.setCustomColors({ [key]: val })
}

const hasCustomColors = computed(() =>
  Object.values(configStore.customColors).some(v => v !== ''),
)

const syncStatus = ref<'idle' | 'loading' | 'ok' | 'error'>('idle')

async function syncToWebDAV() {
  syncStatus.value = 'loading'
  try { await syncStore.syncToWebDAV(); syncStatus.value = 'ok' }
  catch { syncStatus.value = 'error' }
  finally { setTimeout(() => syncStatus.value = 'idle', 3000) }
}

async function syncFromWebDAV() {
  syncStatus.value = 'loading'
  try { await syncStore.syncFromWebDAV(); syncStatus.value = 'ok' }
  catch { syncStatus.value = 'error' }
  finally { setTimeout(() => syncStatus.value = 'idle', 3000) }
}
</script>

<template>
  <AppModal
    :model-value="modelValue"
    title="设置"
    width="680px"
    :footer="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="flex gap-4 min-h-[480px] -mx-6 -my-4">
      <!-- Tab nav -->
      <div class="w-32 shrink-0 flex flex-col gap-1 pt-4 pl-4 border-r border-(--color-border)">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left"
          :class="activeTab === tab.key
            ? 'bg-(--color-primary-light) text-(--color-primary) font-medium'
            : 'text-(--color-text-secondary) hover:bg-(--color-bg-secondary)'"
          @click="activeTab = tab.key"
        >
          <AppIcon :name="tab.icon" :size="14" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto py-4 pr-4 pl-2">

        <!-- General -->
        <template v-if="activeTab === 'general'">
          <div class="flex flex-col gap-5">
            <!-- Theme -->
            <div>
              <label class="block text-xs font-medium text-(--color-text-secondary) mb-2">主题</label>
              <div class="flex gap-2">
                <button
                  v-for="t in themes" :key="t.value"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors"
                  :class="configStore.theme === t.value ? 'border-(--color-primary) bg-(--color-primary-light) text-(--color-primary)' : 'border-(--color-border) text-(--color-text-secondary) hover:border-(--color-primary)/40'"
                  @click="setTheme(t.value)"
                >
                  <AppIcon :name="t.icon" :size="12" /> {{ t.label }}
                </button>
              </div>
            </div>

            <!-- Color scheme -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-medium text-(--color-text-secondary)">界面配色</label>
                <button
                  v-if="hasCustomColors"
                  class="text-xs text-(--color-primary) hover:underline flex items-center gap-1"
                  @click="configStore.resetColors()"
                >
                  <AppIcon name="rotate-ccw" :size="11" />恢复默认
                </button>
              </div>
              <div class="flex flex-col gap-2">
                <div
                  v-for="item in colorItems" :key="item.key"
                  class="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-(--color-bg-secondary)"
                >
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-(--color-text)">{{ item.label }}</p>
                    <p class="text-xs text-(--color-text-muted)">{{ item.desc }}</p>
                  </div>
                  <label class="relative flex items-center gap-2 cursor-pointer shrink-0">
                    <!-- 色块预览 -->
                    <span
                      class="w-8 h-8 rounded-lg border-2 border-(--color-border) shadow-sm transition-transform hover:scale-110"
                      :style="{ background: getColor(item.key) }"
                    />
                    <input
                      type="color"
                      :value="getColor(item.key)"
                      class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      @input="setColor(item.key, ($event.target as HTMLInputElement).value)"
                    />
                  </label>
                  <!-- 单项重置 -->
                  <button
                    v-if="configStore.customColors[item.key]"
                    class="text-(--color-text-muted) hover:text-(--color-danger) transition-colors"
                    title="重置此项"
                    @click="setColor(item.key, '')"
                  >
                    <AppIcon name="x" :size="13" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Font size -->
            <div>
              <label class="block text-xs font-medium text-(--color-text-secondary) mb-2">字体大小：{{ configStore.fontSize }}px</label>
              <input type="range" min="12" max="20" :value="configStore.fontSize" class="w-full accent-(--color-primary)"
                @input="configStore.setFontSize(+($event.target as HTMLInputElement).value)" />
            </div>

            <!-- Send key -->
            <div>
              <label class="block text-xs font-medium text-(--color-text-secondary) mb-2">发送快捷键</label>
              <div class="flex gap-2">
                <button
                  v-for="key in ['Enter', 'Shift+Enter'] as const" :key="key"
                  class="px-3 py-1.5 rounded-lg border text-sm transition-colors"
                  :class="configStore.sendKey === key ? 'border-(--color-primary) bg-(--color-primary-light) text-(--color-primary)' : 'border-(--color-border) text-(--color-text-secondary)'"
                  @click="configStore.sendKey = key; configStore.save()"
                >{{ key }}</button>
              </div>
            </div>

            <!-- Auto title -->
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-(--color-text)">自动生成对话标题</p>
                <p class="text-xs text-(--color-text-muted)">根据第一条消息自动生成对话标题</p>
              </div>
              <input type="checkbox" :checked="configStore.autoGenerateTitle" class="w-4 h-4 accent-(--color-primary)"
                @change="configStore.autoGenerateTitle = ($event.target as HTMLInputElement).checked; configStore.save()" />
            </div>
          </div>
        </template>

        <!-- Model Config -->
        <template v-if="activeTab === 'model'">
          <div class="flex flex-col gap-4">
            <div>
              <label class="block text-xs font-medium text-(--color-text-secondary) mb-2">Temperature：{{ configStore.modelConfig.temperature }}</label>
              <input type="range" min="0" max="2" step="0.1" :value="configStore.modelConfig.temperature" class="w-full accent-(--color-primary)"
                @input="configStore.updateModelConfig({ temperature: +($event.target as HTMLInputElement).value })" />
              <p class="text-xs text-(--color-text-muted) mt-1">值越高回答越发散（0-2）</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-(--color-text-secondary) mb-2">最大 Token 数：{{ configStore.modelConfig.max_tokens }}</label>
              <input type="range" min="256" max="32768" step="256" :value="configStore.modelConfig.max_tokens" class="w-full accent-(--color-primary)"
                @input="configStore.updateModelConfig({ max_tokens: +($event.target as HTMLInputElement).value })" />
            </div>
            <div>
              <label class="block text-xs font-medium text-(--color-text-secondary) mb-2">历史消息数：{{ configStore.modelConfig.historyMessageCount }}</label>
              <input type="range" min="0" max="32" :value="configStore.modelConfig.historyMessageCount" class="w-full accent-(--color-primary)"
                @input="configStore.updateModelConfig({ historyMessageCount: +($event.target as HTMLInputElement).value })" />
            </div>
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-(--color-text)">注入系统提示词</p>
                <p class="text-xs text-(--color-text-muted)">向每个对话注入时间等信息</p>
              </div>
              <input type="checkbox" :checked="configStore.modelConfig.enableInjectSystemPrompts" class="w-4 h-4 accent-(--color-primary)"
                @change="configStore.updateModelConfig({ enableInjectSystemPrompts: ($event.target as HTMLInputElement).checked })" />
            </div>
          </div>
        </template>

        <!-- Access / API Keys -->
        <template v-if="activeTab === 'access'">
          <div class="flex flex-col gap-4">
            <AppInput label="访问密码" placeholder="访问密码（服务端设置时需要）" type="password"
              :model-value="accessStore.accessCode" @update:model-value="accessStore.update({ accessCode: $event })" />
            <AppInput label="OpenAI API Key" :model-value="accessStore.openaiApiKey" type="password" placeholder="sk-..."
              @update:model-value="accessStore.update({ openaiApiKey: $event })" />
            <AppInput label="OpenAI Base URL" :model-value="accessStore.openaiUrl"
              @update:model-value="accessStore.update({ openaiUrl: $event })" />
            <AppInput label="Anthropic API Key" :model-value="accessStore.anthropicApiKey" type="password" placeholder="sk-ant-..."
              @update:model-value="accessStore.update({ anthropicApiKey: $event })" />
            <AppInput label="Google API Key" :model-value="accessStore.googleApiKey" type="password"
              @update:model-value="accessStore.update({ googleApiKey: $event })" />
            <AppInput label="DeepSeek API Key" :model-value="accessStore.deepseekApiKey" type="password"
              @update:model-value="accessStore.update({ deepseekApiKey: $event })" />

            <!-- ── Ollama ── -->
            <div class="border-t border-(--color-border) pt-4">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <AppIcon name="bot" :size="14" class="text-(--color-primary)" />
                  <span class="text-sm font-semibold text-(--color-text)">Ollama 本地模型</span>
                  <!-- 连接状态指示 -->
                  <span v-if="ollamaConnected === true"  class="text-xs text-green-500 flex items-center gap-1"><AppIcon name="confirm" :size="10" /> 已连接</span>
                  <span v-else-if="ollamaConnected === false" class="text-xs text-red-400 flex items-center gap-1"><AppIcon name="cancel" :size="10" /> 未连接</span>
                </div>
                <AppButton variant="secondary" :loading="ollamaLoading" @click="testOllama">
                  测试连接
                </AppButton>
              </div>

              <AppInput
                label="Ollama 服务地址"
                :model-value="accessStore.ollamaUrl"
                placeholder="http://localhost:11434"
                @update:model-value="accessStore.update({ ollamaUrl: $event })"
              />

              <p v-if="ollamaError" class="mt-2 text-xs text-red-400">⚠ {{ ollamaError }}</p>

              <!-- 已安装模型列表 -->
              <div v-if="ollamaModels.length" class="mt-3">
                <p class="text-xs text-(--color-text-muted) mb-2">已安装模型（{{ ollamaModels.length }} 个）：</p>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="m in ollamaModels" :key="m.name"
                    class="px-2 py-0.5 bg-(--color-primary-light) text-(--color-primary) text-xs rounded-full"
                  >{{ m.name }}</span>
                </div>
              </div>

              <p class="mt-3 text-xs text-(--color-text-muted)">
                需先本地运行 Ollama：<code class="bg-(--color-bg-secondary) px-1 rounded">ollama serve</code>，
                并设置 <code class="bg-(--color-bg-secondary) px-1 rounded">OLLAMA_ORIGINS=*</code> 以允许跨域访问。
              </p>
            </div>
          </div>
        </template>

        <!-- Sync -->
        <template v-if="activeTab === 'sync'">
          <div class="flex flex-col gap-4">
            <p class="text-xs text-(--color-text-muted)">数据直接同步到您的 WebDAV 或 UpStash，不经过本服务器。</p>
            <AppInput label="WebDAV 服务器" :model-value="syncStore.webdav.server" placeholder="https://dav.example.com/dav/"
              @update:model-value="syncStore.update({ webdav: { ...syncStore.webdav, server: $event } })" />
            <AppInput label="用户名" :model-value="syncStore.webdav.username"
              @update:model-value="syncStore.update({ webdav: { ...syncStore.webdav, username: $event } })" />
            <AppInput label="密码" :model-value="syncStore.webdav.password" type="password"
              @update:model-value="syncStore.update({ webdav: { ...syncStore.webdav, password: $event } })" />
            <div class="flex gap-2">
              <AppButton variant="secondary" :loading="syncStatus === 'loading'" @click="syncToWebDAV">⬆ 上传备份</AppButton>
              <AppButton variant="secondary" :loading="syncStatus === 'loading'" @click="syncFromWebDAV">⬇ 恢复备份</AppButton>
            </div>
            <p v-if="syncStore.lastSyncTime" class="text-xs text-(--color-text-muted)">上次同步：{{ syncStore.lastSyncTimeStr }}</p>
            <p v-if="syncStatus === 'ok'" class="text-xs text-green-500">✓ 同步成功</p>
            <p v-if="syncStatus === 'error'" class="text-xs text-red-500">✗ 同步失败，请检查配置</p>
          </div>
        </template>

        <!-- About -->
        <template v-if="activeTab === 'about'">
          <div class="flex flex-col items-center gap-4 py-6">
            <AppLogo size="lg" vertical />
            <p class="text-sm text-(--color-text-muted) text-center">
              基于 Vue3 + Nuxt4 构建的 AI 聊天客户端<br />
              支持 14+ AI 提供商，完全复刻 NextChat 功能
            </p>
            <div class="flex gap-3">
              <a href="https://github.com/ChatGPTNextWeb/NextChat" target="_blank" class="text-xs text-(--color-primary) hover:underline flex items-center gap-1">
                <AppIcon name="github" :size="12" /> NextChat 原项目
              </a>
            </div>
            <div class="text-xs text-(--color-text-muted) text-center mt-2">
              <p>数据存储：IndexedDB（本地优先）</p>
              <p>版本：v1.0.0</p>
            </div>
          </div>
        </template>

      </div>
    </div>
  </AppModal>
</template>
