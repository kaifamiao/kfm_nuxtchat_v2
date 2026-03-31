/**
 * 客户端存储初始化插件
 * .client.ts 后缀确保只在浏览器执行
 * defineNuxtPlugin async 会等待 await 完成后才挂载应用，避免闪烁空状态
 */
import { useChatStore } from '~/stores/chat'
import { useConfigStore } from '~/stores/config'
import { useMaskStore } from '~/stores/mask'
import { useAccessStore } from '~/stores/access'
import { useSyncStore } from '~/stores/sync'

export default defineNuxtPlugin(async () => {
  const configStore = useConfigStore()
  const chat = useChatStore()
  const maskStore = useMaskStore()
  const accessStore = useAccessStore()
  const syncStore = useSyncStore()

  // 并行从 IndexedDB 加载所有 store
  await Promise.all([
    configStore.load(),
    chat.load(),
    maskStore.load(),
    accessStore.load(),
    syncStore.load(),
  ])

  // 加载完成后立即应用主题，避免主题闪烁
  configStore.setTheme(configStore.theme)
})
