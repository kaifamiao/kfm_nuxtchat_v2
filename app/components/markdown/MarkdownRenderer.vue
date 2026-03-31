<script setup lang="ts">
import { marked } from 'marked'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'

const props = defineProps<{
  content: string
  isUser?: boolean
}>()

// Configure marked with syntax highlighting
const renderer = new marked.Renderer()

renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
  const highlighted = hljs.highlight(text, { language }).value
  return `
    <div class="code-block">
      <div class="code-header">
        <span class="code-lang">${language}</span>
        <button class="copy-code-btn" data-code="${encodeURIComponent(text)}">复制</button>
      </div>
      <pre><code class="hljs language-${language}">${highlighted}</code></pre>
    </div>
  `
}

marked.setOptions({ breaks: true, gfm: true })

const html = computed(() => {
  if (!props.content) return ''
  try {
    const raw = marked.parse(props.content, { renderer }) as string
    if (import.meta.client) return DOMPurify.sanitize(raw, { ADD_ATTR: ['data-code'] })
    return raw
  } catch {
    return props.content
  }
})

// Handle copy button clicks
function handleClick(e: Event) {
  const btn = (e.target as Element).closest('.copy-code-btn') as HTMLButtonElement
  if (!btn) return
  const code = decodeURIComponent(btn.dataset.code || '')
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = '已复制'
    setTimeout(() => { btn.textContent = '复制' }, 2000)
  })
}
</script>

<template>
  <div
    class="markdown-body"
    :class="{ 'user-message': isUser }"
    v-html="html"
    @click="handleClick"
  />
</template>

<style>
/* Highlight.js theme (GitHub Dark) */
@import 'highlight.js/styles/github-dark.css';

.markdown-body {
  line-height: 1.7;
  word-break: break-word;
}

.markdown-body p { margin: 0.4em 0; }
.markdown-body p:first-child { margin-top: 0; }
.markdown-body p:last-child { margin-bottom: 0; }

.markdown-body h1,.markdown-body h2,.markdown-body h3,
.markdown-body h4,.markdown-body h5,.markdown-body h6 {
  font-weight: 600;
  margin: 0.8em 0 0.4em;
}

.markdown-body ul,.markdown-body ol { padding-left: 1.5em; margin: 0.4em 0; }
.markdown-body li { margin: 0.2em 0; }

.markdown-body blockquote {
  border-left: 3px solid var(--color-border-dark);
  margin: 0.5em 0;
  padding: 0.25em 0.75em;
  color: var(--color-text-secondary);
}

.markdown-body table { border-collapse: collapse; width: 100%; margin: 0.5em 0; }
.markdown-body th,.markdown-body td { border: 1px solid var(--color-border); padding: 0.4em 0.75em; }
.markdown-body th { background: var(--color-bg-secondary); font-weight: 600; }

.markdown-body :not(pre) > code {
  background: var(--color-bg-tertiary);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.875em;
}

.code-block { border-radius: 8px; overflow: hidden; margin: 0.5em 0; }

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1e1e1e;
  padding: 0.4em 0.75em;
}
.code-lang { color: #8b949e; font-size: 0.75em; text-transform: uppercase; }
.copy-code-btn {
  color: #8b949e;
  font-size: 0.75em;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #30363d;
  background: transparent;
  transition: all 0.15s;
}
.copy-code-btn:hover { color: #e6edf3; border-color: #6e7681; }

.code-block pre { margin: 0; border-radius: 0; }

/* User messages - override dark code blocks to readable */
.user-message .code-block { filter: brightness(1.2); }
</style>
