export function autoContentLength(request: string): string {
  const regex = /Content-length:.*\n/gi
  const normalized = normalizeLineEndings(request)
  const sp = normalized.split('\n\n', 2)
  if (sp.length > 1) {
    const bodyLength = httpBodyByteLength(sp[1])
    return normalized.replace(regex, `Content-Length: ${bodyLength}\n`)
  }
  return normalized
}

function httpBodyByteLength(body: string): number {
  if (!body) return 0
  return new TextEncoder().encode(body.split('\n').join('\r\n')).length
}

function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

export function formatHttpMessage(content: string): string {
  const normalized = normalizeLineEndings(content).trimEnd()
  if (!normalized) return ''

  const separator = normalized.indexOf('\n\n')
  const headerBlock = separator === -1 ? normalized : normalized.slice(0, separator)
  const body = separator === -1 ? '' : normalized.slice(separator + 2)

  const rawHeaderLines = headerBlock.split('\n')
  const headers: string[] = []

  for (let i = 0; i < rawHeaderLines.length; i++) {
    const trimmed = rawHeaderLines[i]!.trim()
    if (!trimmed) continue

    if (i === 0) {
      headers.push(trimmed.replace(/\s+/g, ' '))
      continue
    }

    const colonIdx = trimmed.indexOf(':')
    if (colonIdx > 0) {
      const key = trimmed.slice(0, colonIdx).trim()
      const value = trimmed.slice(colonIdx + 1).trim()
      headers.push(`${key}: ${value}`)
    } else {
      headers.push(trimmed)
    }
  }

  if (!body.trim()) {
    return `${headers.join('\n')}\n\n`
  }

  return `${headers.join('\n')}\n\n${body}`
}
