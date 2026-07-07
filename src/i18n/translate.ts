import type { TranslationDict, TranslateParams } from '@/i18n/types'

export function getNestedValue(dict: TranslationDict, path: string): string | undefined {
  const parts = path.split('.')
  let current: unknown = dict
  for (const part of parts) {
    if (typeof current !== 'object' || current === null || !(part in current)) {
      return undefined
    }
    current = (current as TranslationDict)[part]
  }
  return typeof current === 'string' ? current : undefined
}

export function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(params[key] ?? ''))
}

export function createTranslator(dict: TranslationDict) {
  return (key: string, params?: TranslateParams): string => {
    const value = getNestedValue(dict, key)
    if (value === undefined) return key
    return interpolate(value, params)
  }
}
