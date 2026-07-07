import { Plus, Trash2 } from 'lucide-react'
import { GroupedStringSelect } from '@/components/common/GroupedSelect'
import { FieldLabel } from '@/components/common/FieldHint'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { COLLECTION_GROUPS, VARIABLE_GROUPS } from '@/constants/crsRuleSchema'
import { useTranslation } from '@/i18n'
import type { CollectionEntry, ParsedRule, RuleStep, VariableEntry } from '@/types/rules'

interface VariablesSectionProps {
  rule: ParsedRule
  onChange: (rule: ParsedRule) => void
}

function updateStep(rule: ParsedRule, stepId: string, updater: (step: RuleStep) => RuleStep): ParsedRule {
  return {
    ...rule,
    steps: rule.steps.map((step) => (step.id === stepId ? updater(step) : step)),
  }
}

function VariableRow({
  entry,
  onChange,
  onRemove,
  t,
}: {
  entry: VariableEntry
  onChange: (entry: VariableEntry) => void
  onRemove: () => void
  t: (key: string) => string
}) {
  return (
    <div className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_auto_auto]">
      <GroupedStringSelect
        value={entry.name}
        groups={VARIABLE_GROUPS}
        placeholder={t('variables.variablePlaceholder')}
        getGroupLabel={(id) => t(`schema.variableGroups.${id}`)}
        onValueChange={(value) => onChange({ ...entry, name: value })}
      />
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={entry.excluded} onCheckedChange={(value) => onChange({ ...entry, excluded: Boolean(value) })} />
        {t('variables.negate')}
      </label>
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}><Trash2 className="h-4 w-4" /></Button>
    </div>
  )
}

function CollectionRow({
  entry,
  onChange,
  onRemove,
  t,
}: {
  entry: CollectionEntry
  onChange: (entry: CollectionEntry) => void
  onRemove: () => void
  t: (key: string) => string
}) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
        <GroupedStringSelect
          value={entry.name}
          groups={COLLECTION_GROUPS}
          placeholder={t('variables.collectionPlaceholder')}
          getGroupLabel={(id) => t(`schema.variableGroups.${id}`)}
          onValueChange={(value) => onChange({ ...entry, name: value })}
        />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={entry.count} onCheckedChange={(value) => onChange({ ...entry, count: Boolean(value) })} />
          {t('variables.count')}
        </label>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}><Trash2 className="h-4 w-4" /></Button>
      </div>
      <div className="space-y-2">
        <FieldLabel label={t('variables.selectors')} />
        <Input
          value={entry.arguments.join(', ')}
          onChange={(event) => onChange({
            ...entry,
            arguments: event.target.value.split(',').map((part) => part.trim()).filter(Boolean),
          })}
          placeholder={t('variables.selectorsPlaceholder')}
        />
      </div>
      <div className="space-y-2">
        <FieldLabel label={t('variables.excludedSelectors')} />
        <Input
          value={entry.excluded.join(', ')}
          onChange={(event) => onChange({
            ...entry,
            excluded: event.target.value.split(',').map((part) => part.trim()).filter(Boolean),
          })}
        />
      </div>
    </div>
  )
}

export function VariablesSection({ rule, onChange }: VariablesSectionProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">{t('variables.hint')}</p>
      {rule.steps.map((step, index) => (
        <div key={step.id} className="space-y-3">
          <h4 className="text-sm font-medium">{t('common.step', { n: index + 1 })}</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FieldLabel label={t('variables.variables')} hint={t('hints.sections.variables')} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange(updateStep(rule, step.id, (current) => ({
                  ...current,
                  variables: [...current.variables, { name: 'REQUEST_URI', excluded: false }],
                })))}
              >
                <Plus className="h-4 w-4" /> {t('variables.addVariable')}
              </Button>
            </div>
            {step.variables.map((entry, entryIndex) => (
              <VariableRow
                key={`${step.id}-var-${entryIndex}`}
                entry={entry}
                t={t}
                onChange={(updated) => onChange(updateStep(rule, step.id, (current) => ({
                  ...current,
                  variables: current.variables.map((item, idx) => (idx === entryIndex ? updated : item)),
                })))}
                onRemove={() => onChange(updateStep(rule, step.id, (current) => ({
                  ...current,
                  variables: current.variables.filter((_, idx) => idx !== entryIndex),
                })))}
              />
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FieldLabel label={t('variables.collections')} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange(updateStep(rule, step.id, (current) => ({
                  ...current,
                  collections: [...current.collections, { name: 'ARGS', arguments: [], excluded: [], count: false }],
                })))}
              >
                <Plus className="h-4 w-4" /> {t('variables.addCollection')}
              </Button>
            </div>
            {step.collections.map((entry, entryIndex) => (
              <CollectionRow
                key={`${step.id}-col-${entryIndex}`}
                entry={entry}
                t={t}
                onChange={(updated) => onChange(updateStep(rule, step.id, (current) => ({
                  ...current,
                  collections: current.collections.map((item, idx) => (idx === entryIndex ? updated : item)),
                })))}
                onRemove={() => onChange(updateStep(rule, step.id, (current) => ({
                  ...current,
                  collections: current.collections.filter((_, idx) => idx !== entryIndex),
                })))}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
