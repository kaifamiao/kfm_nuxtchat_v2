<script setup lang="ts">
/**
 * AppIcon - 统一图标组件
 * 通过 name prop 动态加载 assets/icons/*.svg
 */
const props = withDefaults(defineProps<{
  name: string
  size?: number | string
  color?: string
  class?: string
}>(), {
  size: 16,
})

// Dynamic SVG import - lazy loaded
const svgModule = ref<string | null>(null)

watchEffect(async () => {
  try {
    // Using vite-svg-loader's ?raw mode for inline SVG
    const mod = await import(`~/assets/icons/${props.name}.svg?raw`)
    svgModule.value = mod.default
  } catch {
    svgModule.value = null
  }
})
</script>

<template>
  <span
    class="inline-flex items-center justify-center shrink-0"
    :style="{
      width: typeof size === 'number' ? `${size}px` : size,
      height: typeof size === 'number' ? `${size}px` : size,
      color: color,
    }"
    :class="props.class"
    v-html="svgModule"
  />
</template>

<style scoped>
span :deep(svg) {
  width: 100%;
  height: 100%;
  fill: currentColor;
}
</style>
