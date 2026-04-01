/**
 * 内置 MCP 服务端（JSON-RPC 2.0 over HTTP）
 * 实现 MCP 协议核心方法：initialize / tools/list / tools/call
 * 内置六个工具：get_current_datetime / calculate / get_random_number / web_search / get_weather / fetch_url
 *
 * web_search 搜索引擎优先级：
 *   1. TAVILY_API_KEY       → Tavily（专为 AI 设计，1000次/月免费）
 *   2. SERPER_API_KEY       → Serper.dev（Google 结果，2500次/月免费）
 *   3. BRAVE_SEARCH_API_KEY → Brave Search（2000次/月免费）
 *   4. 无 key               → DuckDuckGo Instant Answer（免费，无需注册）
 */
import { defineEventHandler, readBody } from 'h3'

const TOOLS = [
  {
    name: 'get_current_datetime',
    description: '获取当前日期和时间（服务器时间）',
    inputSchema: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: '时区，例如 Asia/Shanghai（可选，默认 Asia/Shanghai）',
        },
      },
      required: [],
    },
  },
  {
    name: 'calculate',
    description: '计算数学表达式，支持加减乘除、括号、幂运算（^ 或 **）',
    inputSchema: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: '数学表达式，例如 "2 + 3 * 4" 或 "(10 - 5) / 2"',
        },
      },
      required: ['expression'],
    },
  },
  {
    name: 'get_random_number',
    description: '在指定范围内生成一个随机整数',
    inputSchema: {
      type: 'object',
      properties: {
        min: { type: 'number', description: '最小值（含）' },
        max: { type: 'number', description: '最大值（含）' },
      },
      required: ['min', 'max'],
    },
  },
  {
    name: 'web_search',
    description: '搜索互联网上的实时信息，返回相关网页标题、链接和摘要。适合查询新闻、最新事件、实时数据等',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索关键词或问题，支持中英文',
        },
        count: {
          type: 'number',
          description: '返回结果数量（1-10，默认 5）',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_weather',
    description: '获取指定城市的实时天气，包括温度、体感温度、天气状况、湿度、风速、今日最高/最低温。无需 API Key',
    inputSchema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: '城市名称，支持中英文，如 "北京"、"Shanghai"、"New York"',
        },
      },
      required: ['city'],
    },
  },
  {
    name: 'fetch_url',
    description: '抓取指定网页的正文内容并返回纯文本，适合阅读文章、获取页面信息、总结网页内容',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: '要抓取的网页 URL，需包含 http:// 或 https://',
        },
        max_length: {
          type: 'number',
          description: '返回内容最大字符数（默认 3000，最大 8000）',
        },
      },
      required: ['url'],
    },
  },
]

// ─── 搜索实现 ────────────────────────────────────────────────────────────────

interface SearchResult { title: string; url: string; snippet: string }

/** Tavily：专为 AI 优化的搜索引擎（需 TAVILY_API_KEY） */
async function searchWithTavily(query: string, count: number, apiKey: string): Promise<SearchResult[]> {
  const resp: any = await $fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { api_key: apiKey, query, max_results: count, search_depth: 'basic', include_answer: false },
  })
  return (resp.results ?? []).slice(0, count).map((r: any) => ({
    title: r.title ?? '',
    url: r.url ?? '',
    snippet: r.content ?? '',
  }))
}

/** Serper.dev：Google 搜索结果（需 SERPER_API_KEY） */
async function searchWithSerper(query: string, count: number, apiKey: string): Promise<SearchResult[]> {
  const resp: any = await $fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: { q: query, num: count, hl: 'zh-cn', gl: 'cn' },
  })
  return (resp.organic ?? []).slice(0, count).map((r: any) => ({
    title: r.title ?? '',
    url: r.link ?? '',
    snippet: r.snippet ?? '',
  }))
}

/** Brave Search API（需 BRAVE_SEARCH_API_KEY） */
async function searchWithBrave(query: string, count: number, apiKey: string): Promise<SearchResult[]> {
  const resp: any = await $fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}&search_lang=zh-hans`,
    { headers: { 'Accept': 'application/json', 'X-Subscription-Token': apiKey } },
  )
  return (resp.web?.results ?? []).slice(0, count).map((r: any) => ({
    title: r.title ?? '',
    url: r.url ?? '',
    snippet: r.description ?? '',
  }))
}

/** DuckDuckGo Instant Answer API（免费，无需 key，结果较少） */
async function searchWithDDG(query: string, count: number): Promise<SearchResult[]> {
  const resp: any = await $fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
  )
  const results: SearchResult[] = []
  if (resp.AbstractText && resp.AbstractURL) {
    results.push({ title: resp.Heading ?? query, url: resp.AbstractURL, snippet: resp.AbstractText })
  }
  for (const r of (resp.RelatedTopics ?? [])) {
    if (results.length >= count) break
    if (r.FirstURL && r.Text) {
      results.push({ title: r.Text.split(' - ')[0] ?? '', url: r.FirstURL, snippet: r.Text })
    }
  }
  return results
}

/** 格式化搜索结果为 Markdown 文本，附带引擎来源标注 */
function formatResults(results: SearchResult[], query: string, engine: string): string {
  if (!results.length) return `未找到关于「${query}」的搜索结果。（搜索引擎：${engine}）`
  const header = `> 🔍 搜索引擎：**${engine}**　共 ${results.length} 条结果`
  const body = results.map((r, i) =>
    `**${i + 1}. ${r.title}**\n🔗 ${r.url}\n${r.snippet}`,
  ).join('\n\n')
  return `${header}\n\n${body}`
}

// ─── 天气 ─────────────────────────────────────────────────────────────────────

/** wttr.in 免费天气接口（无需 API Key） */
async function getWeather(city: string): Promise<string> {
  const resp: any = await $fetch(
    `https://wttr.in/${encodeURIComponent(city)}?format=j1`,
    { headers: { 'Accept-Language': 'zh-CN,zh;q=0.9' } },
  )
  const cur = resp.current_condition?.[0]
  if (!cur) throw new Error('无法获取天气数据，请检查城市名称')
  const area = resp.nearest_area?.[0]
  const areaName = area?.areaName?.[0]?.value || city
  const country  = area?.country?.[0]?.value  || ''
  const today    = resp.weather?.[0]
  const desc     = cur.weatherDesc?.[0]?.value || ''
  return [
    `📍 ${areaName}${country ? `，${country}` : ''}`,
    `🌡️ 当前温度：${cur.temp_C}°C（体感 ${cur.FeelsLikeC}°C）`,
    `⛅ 天气状况：${desc}`,
    `💧 湿度：${cur.humidity}%`,
    `🌬️ 风速：${cur.windspeedKmph} km/h ${cur.winddir16Point}`,
    `👁️ 能见度：${cur.visibility} km`,
    today ? `📊 今日最高 / 最低：${today.maxtempC}°C / ${today.mintempC}°C` : '',
  ].filter(Boolean).join('\n')
}

// ─── 网页抓取 ─────────────────────────────────────────────────────────────────

/** 抓取网页，剥离 HTML 标签返回纯文本 */
async function fetchUrl(url: string, maxLength: number): Promise<string> {
  if (!/^https?:\/\//i.test(url)) throw new Error('URL 必须以 http:// 或 https:// 开头')
  const html = await $fetch<string>(url, {
    responseType: 'text',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NuxtChat/1.0; +https://github.com/nuxtchat)' },
  })
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim()
  if (!text) throw new Error('页面内容为空或无法解析')
  return text.length > maxLength
    ? `${text.slice(0, maxLength)}\n\n…（内容已截断，共 ${text.length} 字符）`
    : text
}

/** 安全数学求值：只允许数字和运算符，不使用 eval */
function safeCalc(expr: string): number {
  if (!/^[\d+\-*/.()^\s%]+$/.test(expr))
    throw new Error('表达式含非法字符')
  // eslint-disable-next-line no-new-func
  const result = new Function(`'use strict'; return (${expr.replace(/\^/g, '**')})`)()
  if (!Number.isFinite(result)) throw new Error('结果不是有效数字')
  return result
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { method, params, id } = body || {}

  const ok  = (result: unknown) => ({ jsonrpc: '2.0', result, id })
  const err = (code: number, message: string) => ({ jsonrpc: '2.0', error: { code, message }, id })

  switch (method) {
    case 'initialize':
      return ok({
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'NuxtChat Built-in MCP', version: '1.0.0' },
      })

    case 'tools/list':
      return ok({ tools: TOOLS })

    case 'tools/call': {
      const { name, arguments: args = {} } = params || {}
      try {
        let text = ''

        if (name === 'get_current_datetime') {
          const tz = String(args.timezone || 'Asia/Shanghai')
          text = new Date().toLocaleString('zh-CN', { timeZone: tz, hour12: false })
        }
        else if (name === 'calculate') {
          if (!args.expression) throw new Error('缺少 expression 参数')
          const val = safeCalc(String(args.expression))
          text = `${args.expression} = ${val}`
        }
        else if (name === 'get_random_number') {
          const min = Math.ceil(Number(args.min ?? 0))
          const max = Math.floor(Number(args.max ?? 100))
          if (min > max) throw new Error('min 不能大于 max')
          text = String(Math.floor(Math.random() * (max - min + 1)) + min)
        }
        else if (name === 'web_search') {
          if (!args.query) throw new Error('缺少 query 参数')
          const query = String(args.query)
          const count = Math.min(Math.max(Number(args.count ?? 5), 1), 10)
          const cfg = useRuntimeConfig(event)
          let results: SearchResult[]
          let engine: string
          if (cfg.tavilyApiKey) {
            results = await searchWithTavily(query, count, cfg.tavilyApiKey as string)
            engine = 'Tavily'
          }
          else if (cfg.serperApiKey) {
            results = await searchWithSerper(query, count, cfg.serperApiKey as string)
            engine = 'Serper (Google)'
          }
          else if (cfg.braveSearchApiKey) {
            results = await searchWithBrave(query, count, cfg.braveSearchApiKey as string)
            engine = 'Brave Search'
          }
          else {
            results = await searchWithDDG(query, count)
            engine = 'DuckDuckGo'
          }
          text = formatResults(results, query, engine)
        }
        else if (name === 'get_weather') {
          if (!args.city) throw new Error('缺少 city 参数')
          text = await getWeather(String(args.city))
        }
        else if (name === 'fetch_url') {
          if (!args.url) throw new Error('缺少 url 参数')
          const maxLen = Math.min(Math.max(Number(args.max_length ?? 3000), 100), 8000)
          text = await fetchUrl(String(args.url), maxLen)
        }
        else {
          return err(-32601, `未知工具: ${name}`)
        }

        return ok({ content: [{ type: 'text', text }] })
      }
      catch (e: any) {
        return err(-32603, e.message || '工具执行失败')
      }
    }

    default:
      return err(-32601, `未知方法: ${method ?? '(empty)'}`)
  }
})
