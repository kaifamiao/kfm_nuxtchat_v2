<script setup lang="ts">
import { useChatStore } from '~/stores/chat'

definePageMeta({ layout: 'default' })

const chatStore = useChatStore()

// Ensure there's at least one session
onMounted(() => {
  if (!chatStore.sessions.length && !chatStore.isGenerating) {
    // sessions will be loaded in layout onMounted → just wait
  }
})
</script>

<template>
  <ChatView class="flex-1 min-h-0" />
</template>
