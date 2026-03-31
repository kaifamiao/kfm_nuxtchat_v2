import type { LLMModel, ModelProvider } from './types'

function model(name: string, provider: ModelProvider, displayName?: string): LLMModel {
  return {
    name,
    displayName: displayName ?? name,
    available: true,
    provider: { id: provider.toLowerCase(), providerName: provider, providerType: 'custom' },
    sorted: 0,
  }
}

export const ALL_MODELS: LLMModel[] = [
  // OpenAI
  model('gpt-4o', 'OpenAI', 'GPT-4o'),
  model('gpt-4o-mini', 'OpenAI', 'GPT-4o Mini'),
  model('gpt-4-turbo', 'OpenAI', 'GPT-4 Turbo'),
  model('gpt-4', 'OpenAI', 'GPT-4'),
  model('gpt-3.5-turbo', 'OpenAI', 'GPT-3.5 Turbo'),
  model('o1', 'OpenAI', 'o1'),
  model('o1-mini', 'OpenAI', 'o1-mini'),
  model('o3-mini', 'OpenAI', 'o3-mini'),

  // Anthropic
  model('claude-opus-4-5', 'Anthropic', 'Claude Opus 4.5'),
  model('claude-sonnet-4-5', 'Anthropic', 'Claude Sonnet 4.5'),
  model('claude-3-5-sonnet-20241022', 'Anthropic', 'Claude 3.5 Sonnet'),
  model('claude-3-5-haiku-20241022', 'Anthropic', 'Claude 3.5 Haiku'),
  model('claude-3-opus-20240229', 'Anthropic', 'Claude 3 Opus'),

  // Google
  model('gemini-2.0-flash', 'Google', 'Gemini 2.0 Flash'),
  model('gemini-2.0-flash-thinking-exp', 'Google', 'Gemini 2.0 Flash Thinking'),
  model('gemini-1.5-pro', 'Google', 'Gemini 1.5 Pro'),
  model('gemini-1.5-flash', 'Google', 'Gemini 1.5 Flash'),

  // DeepSeek
  model('deepseek-chat', 'DeepSeek', 'DeepSeek V3'),
  model('deepseek-reasoner', 'DeepSeek', 'DeepSeek R1'),

  // Alibaba
  model('qwen-turbo', 'Alibaba', 'Qwen Turbo'),
  model('qwen-plus', 'Alibaba', 'Qwen Plus'),
  model('qwen-max', 'Alibaba', 'Qwen Max'),
  model('qwen3-235b-a22b', 'Alibaba', 'Qwen3 235B'),

  // ByteDance (Doubao)
  model('ep-20250206185758-nflxs', 'ByteDance', '豆包 Pro 32k'),

  // Moonshot
  model('moonshot-v1-8k', 'Moonshot', 'Kimi 8K'),
  model('moonshot-v1-32k', 'Moonshot', 'Kimi 32K'),
  model('moonshot-v1-128k', 'Moonshot', 'Kimi 128K'),

  // ChatGLM
  model('glm-4', 'ChatGLM', 'GLM-4'),
  model('glm-4-flash', 'ChatGLM', 'GLM-4 Flash'),
  model('glm-4-plus', 'ChatGLM', 'GLM-4 Plus'),

  // SiliconFlow
  model('Qwen/QwQ-32B', 'SiliconFlow', 'QwQ-32B'),
  model('deepseek-ai/DeepSeek-V3', 'SiliconFlow', 'DeepSeek V3'),

  // xAI
  model('grok-2', 'XAI', 'Grok 2'),
  model('grok-3', 'XAI', 'Grok 3'),
  model('grok-3-mini', 'XAI', 'Grok 3 Mini'),

  // Baidu
  model('ernie-bot-4', 'Baidu', 'ERNIE Bot 4'),
  model('ernie-bot', 'Baidu', 'ERNIE Bot'),

  // Iflytek
  model('general', 'Iflytek', 'Spark General'),
]

export const DEFAULT_MODEL = 'gpt-4o-mini'
export const DEFAULT_PROVIDER: ModelProvider = 'OpenAI'

export function getModelsByProvider(provider: ModelProvider) {
  return ALL_MODELS.filter(m => m.provider.providerName === provider)
}

export function findModel(name: string) {
  return ALL_MODELS.find(m => m.name === name)
}

export const PROVIDER_LIST: ModelProvider[] = [
  'OpenAI', 'Azure', 'Anthropic', 'Google', 'DeepSeek',
  'Alibaba', 'ByteDance', 'Moonshot', 'ChatGLM', 'SiliconFlow',
  'XAI', 'Baidu', 'Iflytek', '302AI',
]
