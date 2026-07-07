import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/i18n'
import { importText } from '@/lib/crslangWasm'
import type { ImportRulesResult } from '@/state/rulesStore'
import type { ParsedRule } from '@/types/rules'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (rules: ParsedRule[]) => ImportRulesResult
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const { t } = useTranslation()
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleImport = async () => {
    setLoading(true)
    setError(null)
    setFeedback([])
    const result = await importText(content)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    const importResult = onImport(result.data)
    const messages: string[] = [
      t('importExport.importSummary', { count: importResult.imported.length }),
    ]
    if (importResult.skippedDuplicateIds.length > 0) {
      messages.push(t('importExport.importSkippedDuplicates', {
        ids: importResult.skippedDuplicateIds.join(', '),
      }))
    }
    if (importResult.validationWarnings.length > 0) {
      messages.push(t('importExport.importWarnings'))
      for (const item of importResult.validationWarnings) {
        messages.push(t('validation.importValidationWarning', {
          id: item.id,
          message: t(item.message),
        }))
      }
    }
    if (importResult.validationErrors.length > 0) {
      messages.push(t('importExport.importErrors'))
      for (const item of importResult.validationErrors) {
        messages.push(t('validation.importValidationWarning', {
          id: item.id,
          message: t(item.message),
        }))
      }
    }
    setFeedback(messages)
    if (importResult.imported.length > 0) {
      setContent('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('importExport.importTitle')}</DialogTitle>
          <DialogDescription>{t('importExport.importDescription')}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={t('importExport.importPlaceholder')}
          className="min-h-[280px] font-mono text-xs"
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {feedback.length > 0 ? (
          <div className="space-y-1 text-sm text-muted-foreground">
            {feedback.map((line) => <p key={line}>{line}</p>)}
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={() => void handleImport()} disabled={loading || !content.trim()}>
            {loading ? t('importExport.importing') : t('importExport.import')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
