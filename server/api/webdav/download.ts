export default defineEventHandler(async (event) => {
  const { url, username, password } = await readBody(event)
  if (!url) throw createError({ statusCode: 400, statusMessage: 'url is required' })

  const auth = btoa(`${username}:${password}`)
  const resp = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
  })

  if (!resp.ok) throw createError({ statusCode: resp.status, statusMessage: 'WebDAV download failed' })
  const content = await resp.text()
  return { content }
})
