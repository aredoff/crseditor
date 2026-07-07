import { useEffect, useState } from 'react'
import { useTranslation } from '@/i18n'
import { compileToSecLang, generateCrslang } from '@/lib/crslangWasm'
import type { ParsedRule } from '@/types/rules'

interface LiveCodePreviewProps {
  rule: ParsedRule
}

function CodeBlock({ label, content, generating }: { label: string; content: string; generating: string }) {
  return (
    <div>
      <div className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <pre className="max-h-72 overflow-auto bg-muted p-4 font-mono text-xs whitespace-pre-wrap">
        {content || generating}
      </pre>
    </div>
  )
}

export function LiveCodePreview({ rule }: LiveCodePreviewProps) {
  const { t } = useTranslation()
  const [crslang, setCrslang] = useState('')
  const [seclang, setSeclang] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const update = async () => {
      const yamlResult = await generateCrslang([rule])
      const seclangResult = await compileToSecLang([rule])
      if (cancelled) return
      if (!yamlResult.ok) {
        setError(yamlResult.error)
        setCrslang('')
        setSeclang('')
        return
      }
      if (!seclangResult.ok) {
        setError(seclangResult.error)
        setCrslang('')
        setSeclang('')
        return
      }
      setError(null)
      setCrslang(yamlResult.data)
      setSeclang(seclangResult.data)
    }
    void update()
    return () => {
      cancelled = true
    }
  }, [rule])

  return (
    <div className="self-start overflow-hidden rounded-lg border bg-card xl:sticky xl:top-6">
      {error ? <p className="border-b px-4 py-2 text-sm text-destructive">{error}</p> : null}
      <div className="divide-y">
        <CodeBlock label={t('preview.crslang')} content={crslang} generating={t('common.generating')} />
        <CodeBlock label={t('preview.seclang')} content={seclang} generating={t('common.generating')} />
      </div>
    </div>
  )
}
