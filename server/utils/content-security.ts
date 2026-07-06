function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function stripDangerousAttributes(html: string): string {
  return html
    .replace(/\s*on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src|action|formaction|ping|srcdoc)\s*=\s*(?:"\s*(?:javascript:|data:|vbscript:)[^"]*"|'\s*(?:javascript:|data:|vbscript:)[^']*'|\s*(?:javascript:|data:|vbscript:)[^\s>]+)/gi, '$1="#"')
}

function stripDangerousElements(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
}

function stripUnsafeSchemes(html: string): string {
  return html
    .replace(/(?:javascript:|data:text\/html|vbscript:)/gi, '')
}

export function sanitizeRemoteHtml(html: string): string {
  return stripUnsafeSchemes(stripDangerousAttributes(stripDangerousElements(html)))
}

export function isSafeRemoteUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return false

    const host = url.hostname.toLowerCase()
    if (host === 'localhost' || host === '0.0.0.0' || host === '::1' || host === '[::1]') return false
    if (/^127\./.test(host)) return false
    if (/^10\./.test(host)) return false
    if (/^192\.168\./.test(host)) return false
    if (/^169\.254\./.test(host)) return false
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return false

    return true
  } catch {
    return false
  }
}

export function buildSafeSourceLink(url: string): string {
  if (!isSafeRemoteUrl(url)) return ''
  const safeUrl = escapeHtml(url)
  return `<p><a href="${safeUrl}" target="_blank" rel="noopener noreferrer">🔗 Read original article</a></p>\n`
}

export function getNotionCoverUrl(page: { cover?: { external?: { url?: string }; file?: { url?: string } } | null }): string {
  return page.cover?.external?.url || page.cover?.file?.url || ''
}
