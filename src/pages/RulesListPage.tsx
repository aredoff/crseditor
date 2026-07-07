import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExportDialog } from '@/components/import-export/ExportDialog'
import { ImportDialog } from '@/components/import-export/ImportDialog'
import { RulesTable } from '@/components/rules/RulesTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/i18n'
import { getRuleDescription } from '@/lib/ruleAdapters'
import { useRulesStore } from '@/state/rulesStore'

export function RulesListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { rules, addRule, deleteRule, duplicateRule, importRules } = useRulesStore()
  const [query, setQuery] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  const filteredRules = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return rules
    return rules.filter((rule) => getRuleDescription(rule, t).toLowerCase().includes(normalized))
  }, [query, rules, t])

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{t('app.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('app.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate(`/edit/${addRule()}`)}>{t('rulesList.newRule')}</Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>{t('rulesList.import')}</Button>
          <Button variant="outline" onClick={() => setExportOpen(true)} disabled={rules.length === 0}>
            {t('rulesList.exportAll')}
          </Button>
        </div>
      </div>

      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('rulesList.searchPlaceholder')}
        className="max-w-md"
      />

      {filteredRules.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          {rules.length === 0 ? t('rulesList.empty') : t('rulesList.noMatch')}
        </div>
      ) : (
        <RulesTable
          rules={filteredRules}
          onEdit={(internalId) => navigate(`/edit/${internalId}`)}
          onDuplicate={(internalId) => {
            const copyId = duplicateRule(internalId)
            if (copyId) navigate(`/edit/${copyId}`)
          }}
          onDelete={deleteRule}
        />
      )}

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={(incoming) => importRules(incoming)}
      />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} rules={rules} />
    </div>
  )
}
