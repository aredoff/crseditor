export function stripSecLangComments(content: string): string {
  return content
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim()
      return trimmed.length > 0 && !trimmed.startsWith('#')
    })
    .join('\n')
}

export function normalizeDataFileName(name: string): string {
  const trimmed = name.trim().replace(/^@owasp_crs\//, '')
  if (!trimmed) return ''
  return trimmed.includes('/') ? trimmed.split('/').pop()! : trimmed
}
