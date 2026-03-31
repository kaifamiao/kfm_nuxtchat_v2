<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  type?: string
  disabled?: boolean
  readonly?: boolean
  clearable?: boolean
  prefix?: string
  suffix?: string
  error?: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
}>(), {
  type: 'text',
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  clear: []
  enter: []
}>()

const inputRef = ref<HTMLInputElement>()

const sizeClass = computed(() => ({
  sm: 'h-7 text-xs px-2',
  md: 'h-9 text-sm px-3',
  lg: 'h-11 text-base px-4',
}[props.size]))

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
function onClear() {
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}

defineExpose({ focus: () => inputRef.value?.focus() })
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" class="text-xs font-medium text-(--color-text-secondary)">{{ label }}</label>
    <div class="relative flex items-center">
      <span v-if="prefix" class="absolute left-3 text-xs text-(--color-text-muted) pointer-events-none">{{ prefix }}</span>
      <input
        ref="inputRef"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :class="[
          'w-full border rounded-lg bg-(--color-bg) text-(--color-text) outline-none transition-all',
          'placeholder:text-(--color-text-muted)',
          'focus:ring-2 focus:ring-(--color-primary)/30 focus:border-(--color-primary)',
          error ? 'border-red-400' : 'border-(--color-border)',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
          sizeClass,
          prefix ? 'pl-7!' : '',
          (clearable && modelValue) || suffix ? 'pr-8!' : '',
        ]"
        @input="onInput"
        @change="emit('change', ($event.target as HTMLInputElement).value)"
        @keydown.enter="emit('enter')"
      />
      <button
        v-if="clearable && modelValue"
        class="absolute right-2 text-(--color-text-muted) hover:text-(--color-text) transition-colors"
        @click="onClear"
      >
        <AppIcon name="close" :size="12" />
      </button>
      <span v-else-if="suffix" class="absolute right-3 text-xs text-(--color-text-muted) pointer-events-none">{{ suffix }}</span>
    </div>
    <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
  </div>
</template>
