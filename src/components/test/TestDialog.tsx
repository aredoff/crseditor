import { useCallback, useEffect, useState } from 'react'
import { CollapsibleSection } from '@/components/common/CollapsibleSection'
import { FieldLabel } from '@/components/common/FieldHint'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/i18n'
import { compileToSecLang } from '@/lib/crslangWasm'
import {
  DEFAULT_REQUEST,
  DEFAULT_RESPONSE,
  EXAMPLE_REQUEST,
  EXAMPLE_RESPONSE,
  initCorazaWasm,
  loadDefaultSetup,
  runCorazaTest,
} from '@/lib/corazaWasm'
import { autoContentLength, formatHttpMessage } from '@/lib/httpFormat'
import { stripSecLangComments } from '@/lib/seclangFormat'
import type { CorazaAnalysisResult } from '@/types/coraza'
import type { ParsedRule } from '@/types/rules'

interface TestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rules: ParsedRule[]
}

export function TestDialog({ open, onOpenChange, rules }: TestDialogProps) {
  const { t } = useTranslation()
  const [corazaLoading, setCorazaLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [setupSecLang, setSetupSecLang] = useState('')
  const [rulesPreview, setRulesPreview] = useState('')
  const [request, setRequest] = useState(DEFAULT_REQUEST)
  const [response, setResponse] = useState(DEFAULT_RESPONSE)
  const [autoLength, setAutoLength] = useState(false)
  const [result, setResult] = useState<CorazaAnalysisResult | null>(null)
  const [defaultSetup, setDefaultSetup] = useState('')
  const [dataFileName, setDataFileName] = useState('')
  const [dataFileContent, setDataFileContent] = useState('')

  useEffect(() => {
    if (!open) return
    let cancelled = false

    const bootstrap = async () => {
      setCorazaLoading(true)
      setError(null)
      try {
        const setup = await loadDefaultSetup()
        await initCorazaWasm()
        if (cancelled) return
        setDefaultSetup(setup)
        setSetupSecLang((current) => (current.trim() ? current : stripSecLangComments(setup)))
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('test.corazaLoadError'))
        }
      } finally {
        if (!cancelled) setCorazaLoading(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [open, t])

  useEffect(() => {
    if (!open || rules.length === 0) return
    let cancelled = false
    void compileToSecLang(rules).then((seclang) => {
      if (cancelled) return
      setRulesPreview(seclang.ok ? seclang.data : '')
      if (!seclang.ok && rules.length > 0) {
        setError(seclang.error)
      }
    })
    return () => {
      cancelled = true
    }
  }, [open, rules])

  const handleResetSetup = useCallback(() => {
    setSetupSecLang(stripSecLangComments(defaultSetup))
  }, [defaultSetup])

  const handleLoadExample = useCallback(() => {
    setRequest(EXAMPLE_REQUEST)
    setResponse(EXAMPLE_RESPONSE)
  }, [])

  const handleResetRequest = useCallback(() => {
    setRequest(DEFAULT_REQUEST)
  }, [])

  const handleResetResponse = useCallback(() => {
    setResponse(DEFAULT_RESPONSE)
  }, [])

  const handleRun = useCallback(async () => {
    setRunning(true)
    setError(null)
    setResult(null)

    let req = request
    if (autoLength) {
      req = autoContentLength(request)
      setRequest(req)
    }

    try {
      const seclang = await compileToSecLang(rules)
      if (!seclang.ok) {
        setError(seclang.error)
        return
      }

      const trimmedDataFileName = dataFileName.trim()
      const trimmedDataFileContent = dataFileContent.trim()

      const analysis = await runCorazaTest(
        setupSecLang,
        seclang.data,
        req,
        response,
        trimmedDataFileName && trimmedDataFileContent
          ? [{ name: trimmedDataFileName, content: trimmedDataFileContent }]
          : [],
      )
      setResult(analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('test.runFailed'))
    } finally {
      setRunning(false)
    }
  }, [autoLength, dataFileContent, dataFileName, request, response, rules, setupSecLang, t])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <div className="shrink-0 px-6 pb-4 pt-6 pr-12">
          <DialogHeader>
            <DialogTitle>{t('test.title')}</DialogTitle>
            <DialogDescription>{t('test.description', { count: rules.length })}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
        {corazaLoading ? (
          <p className="text-sm text-muted-foreground">{t('test.corazaLoading')}</p>
        ) : (
          <div className="space-y-3">
            <CollapsibleSection title={t('test.setupConfiguration')} defaultOpen variant="plain">
              <Textarea
                value={setupSecLang}
                onChange={(event) => setSetupSecLang(event.target.value)}
                className="min-h-[180px] font-mono text-xs"
              />
              <Button variant="outline" size="sm" onClick={handleResetSetup}>
                {t('test.resetSetup')}
              </Button>
            </CollapsibleSection>

            <CollapsibleSection title={t('test.dataFile')} description={t('test.dataFileDesc')} defaultOpen={false} variant="plain">
              <div className="space-y-2">
                <FieldLabel label={t('test.dataFileName')} />
                <Input
                  value={dataFileName}
                  onChange={(event) => setDataFileName(event.target.value)}
                  placeholder={t('test.dataFileNamePlaceholder')}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <FieldLabel label={t('test.dataFileContent')} />
                <Textarea
                  value={dataFileContent}
                  onChange={(event) => setDataFileContent(event.target.value)}
                  placeholder={t('test.dataFileContentPlaceholder')}
                  className="min-h-[120px] font-mono text-xs"
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title={t('test.rulesPreview')} description={t('test.rulesPreviewDesc', { count: rules.length })} defaultOpen={false} variant="plain">
              <Textarea
                value={rulesPreview}
                readOnly
                className="min-h-[120px] font-mono text-xs"
                placeholder={t('test.noRules')}
              />
            </CollapsibleSection>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel label={t('test.request')} />
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setRequest(formatHttpMessage(request))}>
                      {t('test.format')}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={handleResetRequest}>
                      {t('test.resetRequest')}
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={request}
                  onChange={(event) => setRequest(event.target.value)}
                  className="min-h-[200px] font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel label={t('test.response')} />
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setResponse(formatHttpMessage(response))}>
                      {t('test.format')}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={handleResetResponse}>
                      {t('test.resetResponse')}
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={response}
                  onChange={(event) => setResponse(event.target.value)}
                  className="min-h-[200px] font-mono text-xs"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={autoLength} onCheckedChange={(value) => setAutoLength(value === true)} />
              {t('test.autoContentLength')}
            </label>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {result ? (
              <div className="space-y-3 rounded-md border border-border bg-muted p-4 text-sm">
                <div className="grid gap-2 sm:grid-cols-2">
                  <p><span className="font-medium">{t('test.disruptive')}:</span> {result.disruptiveAction}</p>
                  <p><span className="font-medium">{t('test.disruptiveRule')}:</span> {result.disruptiveRule}</p>
                  <p><span className="font-medium">{t('test.engineStatus')}:</span> {result.engineStatus}</p>
                  <p><span className="font-medium">{t('test.duration')}:</span> {result.duration} µs</p>
                </div>
                <div>
                  <p className="mb-2 font-medium">{t('test.matchedRules')} ({result.rulesMatchedTotal})</p>
                  {result.matchedRules.length === 0 ? (
                    <p className="text-muted-foreground">{t('test.passed')}</p>
                  ) : (
                    <ul className="space-y-1 font-mono text-xs">
                      {result.matchedRules.map(([id, message]) => (
                        <li key={`${id}-${message}`}>
                          <span className="text-primary">{id}</span>: {message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {result.auditLog ? (
                  <CollapsibleSection title={t('test.auditLog')} defaultOpen={false} variant="plain">
                    <pre className="max-h-[240px] overflow-auto whitespace-pre-wrap font-mono text-xs">{result.auditLog}</pre>
                  </CollapsibleSection>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
        </div>

        <DialogFooter className="shrink-0 border-t bg-muted/20 px-6 py-4">
          <Button variant="outline" onClick={handleLoadExample} disabled={corazaLoading || running}>
            {t('test.loadExample')}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.close')}</Button>
          <Button
            onClick={() => void handleRun()}
            disabled={corazaLoading || running || rules.length === 0}
          >
            {running ? t('test.running') : t('test.run')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
