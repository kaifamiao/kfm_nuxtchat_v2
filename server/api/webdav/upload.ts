export default defineEventHandler(async (event) => {
  const { url, username, password, content } = await readBody(event)
  if (!url) throw createError({ statusCode: 400, statusMessage: 'url is required' })

  const auth = btoa(`${username}:${password}`)
  const resp = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: content,
  })

  if (!resp.ok) throw createError({ statusCode: resp.status, statusMessage: 'WebDAV upload failed' })
  return { ok: true }
})
