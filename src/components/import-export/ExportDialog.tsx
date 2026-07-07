import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldLabel } from '@/components/common/FieldHint'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/i18n'
import { copyToClipboard, downloadText, exportRules } from '@/lib/exporters'
import type { ExportFormat, ParsedRule } from '@/types/rules'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rules: ParsedRule[]
}

export function ExportDialog({ open, onOpenChange, rules }: ExportDialogProps) {
  const { t } = useTranslation()
  const [format, setFormat] = useState<ExportFormat>('crslang')
  const [preview, setPreview] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const load = async () => {
      try {
        const content = await exportRules(rules, format)
        if (!cancelled) {
          setPreview(content)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setPreview('')
          setError(err instanceof Error ? err.message : t('importExport.exportFailed'))
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [open, rules, format, t])

  const handleCopy = async () => {
    await copyToClipboard(preview)
  }

  const handleDownload = () => {
    const extension = format === 'crslang' ? 'yaml' : 'conf'
    downloadText(`crs-rules.${extension}`, preview)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('importExport.exportTitle')}</DialogTitle>
          <DialogDescription>{t('importExport.exportDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <FieldLabel label={t('importExport.format')} />
          <Select value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="crslang">{t('preview.crslang')}</SelectItem>
              <SelectItem value="seclang">{t('preview.seclang')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea value={preview} readOnly className="min-h-[320px] font-mono text-xs" />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.close')}</Button>
          <Button variant="outline" onClick={() => void handleCopy()} disabled={!preview}>
            {t('importExport.copyToClipboard')}
          </Button>
          <Button onClick={handleDownload} disabled={!preview}>{t('importExport.downloadFile')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
