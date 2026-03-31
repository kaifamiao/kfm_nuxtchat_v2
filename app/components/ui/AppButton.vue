<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'text'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: string
  iconSize?: number
  block?: boolean
  type?: 'button' | 'submit' | 'reset'
}>(), {
  variant: 'secondary',
  size: 'md',
  type: 'button',
})

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const baseClass = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 cursor-pointer select-none border'

const variantClass = computed(() => ({
  primary: 'bg-(--color-primary) hover:bg-(--color-primary-hover) text-white border-transparent shadow-sm',
  secondary: 'bg-(--color-bg-secondary) hover:bg-(--color-bg-tertiary) text-(--color-text) border-(--color-border)',
  ghost: 'bg-transparent hover:bg-(--color-bg-secondary) text-(--color-text) border-transparent',
  danger: 'bg-red-500 hover:bg-red-600 text-white border-transparent',
  text: 'bg-transparent hover:bg-(--color-bg-secondary) text-(--color-text-secondary) border-transparent px-1!',
}[props.variant]))

const sizeClass = computed(() => ({
  sm: 'h-7 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
}[props.size]))
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      baseClass,
      variantClass,
      sizeClass,
      block ? 'w-full' : '',
      (disabled || loading) ? 'opacity-50 cursor-not-allowed' : '',
    ]"
    @click="!disabled && !loading && emit('click', $event)"
  >
    <span v-if="loading" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    <AppIcon v-else-if="icon" :name="icon" :size="iconSize ?? (size === 'sm' ? 12 : size === 'lg' ? 18 : 14)" />
    <slot />
  </button>
</template>
