<script setup lang="ts">
/**
 * AppIcon - 统一图标组件（基于 Lucide Vue Next）
 *
 * 使用方式：
 *   <AppIcon name="Plus" />            ← Lucide 原生 PascalCase 名称
 *   <AppIcon name="add" />             ← 旧式别名（向后兼容）
 *   <AppIcon name="Plus" :size="20" color="red" />
 */
import * as LucideIcons from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  name: string
  size?: number | string
  color?: string
  strokeWidth?: number
  class?: string
}>(), {
  size: 16,
  strokeWidth: 1.75,
})

// ─── 旧式名称 → Lucide PascalCase 别名表 ────────────────────────────────────
const ALIAS: Record<string, string> = {
  // 操作
  add:          'Plus',
  edit:         'Pencil',
  delete:       'Trash2',
  clear:        'Trash2',
  copy:         'Copy',
  rename:       'PenLine',
  confirm:      'Check',
  cancel:       'X',
  close:        'X',
  reload:       'RotateCcw',
  drag:         'GripVertical',
  pin:          'Pin',
  // 导航
  menu:         'Menu',
  left:         'ChevronLeft',
  down:         'ChevronDown',
  bottom:       'ChevronsDown',
  return:       'CornerDownLeft',
  // 媒体 / 语音
  speak:        'Mic',
  'speak-stop': 'Square',
  voice:        'Volume2',
  'voice-white':'Volume2',
  'voice-off':  'VolumeX',
  headphone:    'Headphones',
  play:         'Play',
  pause:        'Pause',
  // 主题
  light:        'Sun',
  dark:         'Moon',
  auto:         'SunMoon',
  // 视觉 / 布局
  eye:          'Eye',
  'eye-off':    'EyeOff',
  zoom:         'ZoomIn',
  max:          'Maximize2',
  min:          'Minimize2',
  size:         'Maximize',
  hd:           'Tv2',
  palette:      'Palette',
  image:        'Image',
  // 功能
  settings:     'Settings',
  config:       'Settings2',
  bot:          'Bot',
  robot:        'Bot',
  brain:        'Brain',
  logo:         'Bot',
  mask:         'Theater',
  plugin:       'Puzzle',
  mcp:          'Cpu',
  prompt:       'Search',
  tool:         'Wrench',
  sd:           'Wand2',
  chat:         'MessageCircle',
  'chat-settings': 'MessageCircleMore',
  history:      'History',
  discovery:    'Compass',
  fire:         'Flame',
  lightning:    'Zap',
  power:        'Power',
  shortcutkey:  'Keyboard',
  'three-dots': 'MoreHorizontal',
  break:        'Scissors',
  // 云 / 数据
  'cloud-success': 'Cloud',
  'cloud-fail':    'CloudOff',
  connection:   'Wifi',
  upload:       'Upload',
  download:     'Download',
  export:       'Share2',
  share:        'Share2',
  // 发送
  'send-white': 'Send',
  // 其他
  github:       'Github',
  loading:      'Loader2',
  'black-bot':  'BotOff',
}

const iconComponent = computed(() => {
  const lucideName = ALIAS[props.name] ?? props.name
  return (LucideIcons as Record<string, any>)[lucideName]
    ?? (LucideIcons as Record<string, any>)['HelpCircle']
})

const sizeVal = computed(() =>
  typeof props.size === 'number' ? props.size : parseInt(props.size as string, 10) || 16,
)
</script>

<template>
  <component
    :is="iconComponent"
    :size="sizeVal"
    :color="color"
    :stroke-width="strokeWidth"
    :class="['shrink-0', props.class]"
  />
</template>
