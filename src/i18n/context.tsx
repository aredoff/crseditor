import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { en } from '@/i18n/locales/en'
import { es } from '@/i18n/locales/es'
import { ru } from '@/i18n/locales/ru'
import { createTranslator } from '@/i18n/translate'
import type { Locale, TranslateParams } from '@/i18n/types'

const STORAGE_KEY = 'crslangweb-locale'

const locales = { en, ru, es } as const

function detectLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'ru' || stored === 'es') return stored
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith('ru')) return 'ru'
  if (lang.startsWith('es')) return 'es'
  return 'en'
}

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: TranslateParams) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const t = useMemo(() => createTranslator(locales[locale]), [locale])

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return (
    <I18nContext.Provider value={value}>
      <TooltipProvider delayDuration={200}>
        {children}
      </TooltipProvider>
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}

export function useTranslation() {
  const { t, locale, setLocale } = useI18n()
  return { t, locale, setLocale }
}
