import { useState } from 'react'
import { CollapsibleSection } from '@/components/common/CollapsibleSection'
import { Button } from '@/components/ui/button'
import { LiveCodePreview } from '@/components/rule-editor/LiveCodePreview'
import { ActionsSection } from '@/components/rule-editor/sections/ActionsSection'
import { CtlSection } from '@/components/rule-editor/sections/CtlSection'
import { MetaSection } from '@/components/rule-editor/sections/MetaSection'
import { OperatorSection } from '@/components/rule-editor/sections/OperatorSection'
import { PhaseChainSection } from '@/components/rule-editor/sections/PhaseChainSection'
import { TransformationsSection } from '@/components/rule-editor/sections/TransformationsSection'
import { VariablesSection } from '@/components/rule-editor/sections/VariablesSection'
import { useTranslation } from '@/i18n'
import { getValidationErrors, getValidationWarnings, validateRule } from '@/lib/validation'
import { syncChainAction } from '@/lib/ruleAdapters'
import type { ParsedRule } from '@/types/rules'

export interface RuleEditorProps {
  rule: ParsedRule
  onSave: (updatedRule: ParsedRule) => void
  onCancel: () => void
}

export function RuleEditor({ rule, onSave, onCancel }: RuleEditorProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(rule)
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])

  const handleSave = () => {
    const normalized = syncChainAction(draft)
    const issues = validateRule(normalized)
    const nextErrors = getValidationErrors(issues)
    const nextWarnings = getValidationWarnings(issues)
    setWarnings(nextWarnings.map((issue) => t(issue.messageKey, issue.messageParams)))
    if (nextErrors.length > 0) {
      setErrors(nextErrors.map((issue) => t(issue.messageKey, issue.messageParams)))
      return
    }
    setErrors([])
    onSave(normalized)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('ruleEditor.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('ruleEditor.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
          <Button onClick={handleSave}>{t('common.save')}</Button>
        </div>
      </div>
      {errors.length > 0 ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {errors.map((error) => <div key={error}>{error}</div>)}
        </div>
      ) : null}
      {warnings.length > 0 ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700">
          {warnings.map((warning) => <div key={warning}>{warning}</div>)}
        </div>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-3">
          <CollapsibleSection title={t('ruleEditor.sections.meta')} description={t('ruleEditor.sections.metaDesc')}>
            <MetaSection rule={draft} onChange={setDraft} />
          </CollapsibleSection>
          <CollapsibleSection title={t('ruleEditor.sections.chain')} description={t('ruleEditor.sections.chainDesc')}>
            <PhaseChainSection rule={draft} onChange={setDraft} />
          </CollapsibleSection>
          <CollapsibleSection title={t('ruleEditor.sections.variables')} description={t('ruleEditor.sections.variablesDesc')}>
            <VariablesSection rule={draft} onChange={setDraft} />
          </CollapsibleSection>
          <CollapsibleSection title={t('ruleEditor.sections.operator')} description={t('ruleEditor.sections.operatorDesc')}>
            <OperatorSection rule={draft} onChange={setDraft} />
          </CollapsibleSection>
          <CollapsibleSection title={t('ruleEditor.sections.actions')} description={t('ruleEditor.sections.actionsDesc')}>
            <ActionsSection rule={draft} onChange={setDraft} />
          </CollapsibleSection>
          <CollapsibleSection title={t('ruleEditor.sections.transformations')} description={t('ruleEditor.sections.transformationsDesc')}>
            <TransformationsSection rule={draft} onChange={setDraft} />
          </CollapsibleSection>
          <CollapsibleSection title={t('ruleEditor.sections.ctl')} description={t('ruleEditor.sections.ctlDesc')}>
            <CtlSection rule={draft} onChange={setDraft} />
          </CollapsibleSection>
        </div>
        <LiveCodePreview rule={draft} />
      </div>
    </div>
  )
}
