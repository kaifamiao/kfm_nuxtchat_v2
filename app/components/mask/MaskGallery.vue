<script setup lang="ts">
import { useMaskStore } from '~/stores/mask'
import { useChatStore } from '~/stores/chat'
import type { Mask } from '~/utils/types'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()

const maskStore = useMaskStore()
const chatStore = useChatStore()

const search = ref('')
const showEditor = ref(false)
const editingMask = ref<Mask | null>(null)

const filteredMasks = computed(() => {
  const q = search.value.toLowerCase().trim()
  return maskStore.allMasks.filter(m =>
    !q || m.name.toLowerCase().includes(q)
  )
})

function createChat(mask: Mask) {
  chatStore.newSession(mask)
  emit('update:modelValue', false)
}

function editMask(mask: Mask) {
  editingMask.value = { ...mask }
  showEditor.value = true
}

function newMask() {
  editingMask.value = null
  showEditor.value = true
}

function saveMask() {
  if (!editingMask.value) return
  if (editingMask.value.id && maskStore.customMasks.find(m => m.id === editingMask.value!.id)) {
    maskStore.update(editingMask.value.id, m => Object.assign(m, editingMask.value))
  } else {
    maskStore.create(editingMask.value)
  }
  showEditor.value = false
}

function deleteMask(id: string) {
  if (confirm('确认删除此 Mask？')) maskStore.delete(id)
}
</script>

<template>
  <AppModal
    :model-value="modelValue"
    title="提示词模板（Mask）"
    width="680px"
    :footer="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="flex items-center gap-2 mb-4">
      <AppInput v-model="search" placeholder="搜索 Mask..." clearable class="flex-1" />
      <AppButton variant="primary" icon="add" @click="newMask">新建</AppButton>
    </div>

    <div class="grid grid-cols-2 gap-3 max-h-[480px] overflow-y-auto -mx-6 px-6">
      <div
        v-for="mask in filteredMasks"
        :key="mask.id"
        class="group border border-(--color-border) rounded-xl p-4 hover:border-(--color-primary)/40 hover:shadow-sm transition-all cursor-pointer"
        @click="createChat(mask)"
      >
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-xl bg-(--color-bg-secondary) flex items-center justify-center shrink-0">
              <AppIcon :name="mask.avatar" :size="18" class="text-(--color-primary)" />
            </div>
            <div>
              <p class="text-sm font-semibold text-(--color-text) leading-tight">{{ mask.name }}</p>
              <p v-if="mask.builtin" class="text-[10px] text-(--color-text-muted)">内置</p>
            </div>
          </div>
          <!-- Actions (non-builtin) -->
          <div v-if="!mask.builtin" class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button class="w-6 h-6 flex items-center justify-center rounded hover:bg-(--color-bg-secondary)" @click.stop="editMask(mask)">
              <AppIcon name="edit" :size="12" class="text-(--color-text-muted)" />
            </button>
            <button class="w-6 h-6 flex items-center justify-center rounded hover:bg-red-100" @click.stop="deleteMask(mask.id)">
              <AppIcon name="delete" :size="12" class="text-(--color-text-muted)" />
            </button>
          </div>
        </div>

        <!-- Context preview -->
        <p class="text-xs text-(--color-text-muted) line-clamp-2 leading-relaxed">
          {{ mask.context[0]?.content?.toString().slice(0, 80) || '无系统提示词' }}
        </p>

        <!-- Model badge -->
        <div class="mt-2">
          <span class="text-[10px] px-2 py-0.5 bg-(--color-bg-secondary) rounded-full text-(--color-text-muted)">
            {{ mask.modelConfig?.model || '默认模型' }}
          </span>
        </div>
      </div>

      <div v-if="!filteredMasks.length" class="col-span-2 text-center py-8 text-(--color-text-muted) text-sm">
        没有找到匹配的 Mask
      </div>
    </div>
  </AppModal>

  <!-- Editor Modal -->
  <AppModal
    v-if="showEditor"
    v-model="showEditor"
    :title="editingMask?.id ? '编辑 Mask' : '新建 Mask'"
    width="520px"
    @confirm="saveMask"
  >
    <div v-if="editingMask || showEditor" class="flex flex-col gap-4">
      <AppInput
        label="名称"
        :model-value="editingMask?.name ?? ''"
        @update:model-value="editingMask = { ...editingMask!, name: $event }"
      />
      <div>
        <label class="block text-xs font-medium text-(--color-text-secondary) mb-2">系统提示词</label>
        <textarea
          class="w-full border border-(--color-border) rounded-lg px-3 py-2 text-sm bg-(--color-bg) text-(--color-text) outline-none focus:border-(--color-primary)/50 resize-none"
          rows="5"
          :value="typeof editingMask?.context[0]?.content === 'string' ? editingMask.context[0].content : ''"
          @input="editingMask = {
            ...editingMask!,
            context: [{ id: 'sys', role: 'system', content: ($event.target as HTMLTextAreaElement).value, date: '' }]
          }"
        />
      </div>
    </div>
  </AppModal>
</template>
