export type Locale = 'en' | 'ru' | 'es'

export type TranslationValue = string | TranslationDict

export interface TranslationDict {
  [key: string]: TranslationValue
}

export type TranslateParams = Record<string, string | number>
