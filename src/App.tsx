import { useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { useTranslation } from '@/i18n'
import { initCrslangWasm, isCrslangWasmReady } from '@/lib/crslangWasm'
import { RuleEditorPage } from '@/pages/RuleEditorPage'
import { RulesListPage } from '@/pages/RulesListPage'
import { RulesStoreProvider } from '@/state/rulesStore'

function WasmBootstrap({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [ready, setReady] = useState(isCrslangWasmReady())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void initCrslangWasm()
      .then(() => setReady(true))
      .catch((err) => setError(err instanceof Error ? err.message : t('app.wasmLoadError')))
  }, [t])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">{t('app.wasmFailed')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">{t('app.wasmLoading')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('app.wasmLoadingHint')}</p>
        </div>
      </div>
    )
  }

  return children
}

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="absolute right-4 top-4 z-10">
        <LanguageSwitcher />
      </div>
      {children}
    </div>
  )
}

export default function App() {
  return (
    <RulesStoreProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
        <WasmBootstrap>
          <AppLayout>
            <Routes>
              <Route path="/" element={<RulesListPage />} />
              <Route path="/edit/:id" element={<RuleEditorPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </WasmBootstrap>
      </BrowserRouter>
    </RulesStoreProvider>
  )
}
