<script setup lang="ts">
const props = withDefaults(defineProps<{
  /** 尺寸预设：sm（侧边栏）/ md / lg（设置页） */
  size?: 'sm' | 'md' | 'lg'
  /** 垂直排列（图标在上、文字在下） */
  vertical?: boolean
  /** 只显示图标，不显示文字 */
  iconOnly?: boolean
}>(), {
  size: 'md',
  vertical: false,
  iconOnly: false,
})

const iconSize = computed(() => ({ sm: 22, md: 36, lg: 56 }[props.size]))
const textClass = computed(() => ({ sm: 'text-sm', md: 'text-base', lg: 'text-xl' }[props.size]))
</script>

<template>
  <div
    class="flex items-center"
    :class="[
      vertical ? 'flex-col gap-1.5' : 'flex-row gap-2',
    ]"
  >
    <!-- 图标 -->
    <AppIcon name="logo" :size="iconSize" class="shrink-0 text-(--color-primary)" />

    <!-- 文字：kfm_ 用次要色，NuxtChat 用主色 -->
    <span v-if="!iconOnly" class="font-bold leading-none" :class="textClass">
      <span class="text-(--color-text-muted)">kfm_</span><span class="text-(--color-primary)">NuxtChat</span>
    </span>
  </div>
</template>
