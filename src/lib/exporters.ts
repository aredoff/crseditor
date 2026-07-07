import { compileToSecLang, generateCrslang } from '@/lib/crslangWasm'
import type { ExportFormat, ParsedRule } from '@/types/rules'

export async function exportRules(rules: ParsedRule[], format: ExportFormat): Promise<string> {
  if (rules.length === 0) return ''
  if (format === 'crslang') {
    const result = await generateCrslang(rules)
    if (!result.ok) throw new Error(result.error)
    return result.data
  }
  const result = await compileToSecLang(rules)
  if (!result.ok) throw new Error(result.error)
  return result.data
}

export function downloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export async function copyToClipboard(content: string): Promise<void> {
  await navigator.clipboard.writeText(content)
}
