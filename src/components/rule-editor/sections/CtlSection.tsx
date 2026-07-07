import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { FieldLabel } from '@/components/common/FieldHint'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CTL_OPTIONS } from '@/constants/crsRuleSchema'
import { useTranslation } from '@/i18n'
import type { CtlEntry, ParsedRule } from '@/types/rules'

interface CtlSectionProps {
  rule: ParsedRule
  onChange: (rule: ParsedRule) => void
}

function updateStepCtl(
  rule: ParsedRule,
  stepId: string,
  updater: (ctl: CtlEntry[]) => CtlEntry[],
): ParsedRule {
  return {
    ...rule,
    steps: rule.steps.map((step) => (
      step.id === stepId ? { ...step, ctl: updater(step.ctl) } : step
    )),
  }
}

function CtlStepEditor({
  stepId,
  ctl,
  rule,
  onChange,
}: {
  stepId: string
  ctl: CtlEntry[]
  rule: ParsedRule
  onChange: (rule: ParsedRule) => void
}) {
  const { t } = useTranslation()

  const updateEntry = (entryId: string, patch: Partial<CtlEntry>) => {
    onChange(updateStepCtl(rule, stepId, (entries) =>
      entries.map((entry) => (entry.id === entryId ? { ...entry, ...patch } : entry)),
    ))
  }

  return (
    <div className="space-y-3">
      {ctl.map((entry) => {
        const ctlKey = entry.key.includes('=') ? entry.key.split('=')[0] : entry.key
        const option = CTL_OPTIONS.find((item) => item.key === ctlKey)
        const currentValue = entry.value.includes('=') ? entry.value.split('=').slice(1).join('=') : entry.value
        const useSelect = option?.valueMode === 'select'
        return (
          <div key={entry.id} className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-2">
              <FieldLabel label={t('ctl.directive')} />
              <Select
                value={ctlKey}
                onValueChange={(key) => {
                  const selected = CTL_OPTIONS.find((item) => item.key === key)
                  const defaultValue = selected?.values[0] ?? ''
                  updateEntry(entry.id, { key, value: `${key}=${defaultValue}` })
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CTL_OPTIONS.map((item) => <SelectItem key={item.key} value={item.key}>{item.key}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <FieldLabel label={t('ctl.value')} />
              {useSelect ? (
                <Select
                  value={currentValue}
                  onValueChange={(value) => updateEntry(entry.id, { value: `${option!.key}=${value}`, key: option!.key })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {option!.values.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={currentValue}
                  placeholder={option?.values[0] ?? t('ctl.valuePlaceholder')}
                  onChange={(event) => updateEntry(entry.id, {
                    value: `${ctlKey}=${event.target.value}`,
                    key: ctlKey,
                  })}
                />
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(updateStepCtl(rule, stepId, (entries) =>
                entries.filter((item) => item.id !== entry.id),
              ))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange(updateStepCtl(rule, stepId, (entries) => [
          ...entries,
          { id: crypto.randomUUID(), key: 'ruleEngine', value: 'ruleEngine=Off' },
        ]))}
      >
        <Plus className="h-4 w-4" /> {t('ctl.addAction')}
      </Button>
    </div>
  )
}

export function CtlSection({ rule, onChange }: CtlSectionProps) {
  const { t } = useTranslation()
  const [activeStepIndex, setActiveStepIndex] = useState(rule.isChained ? rule.steps.length - 1 : 0)
  const safeIndex = Math.min(activeStepIndex, Math.max(rule.steps.length - 1, 0))
  const activeStep = rule.steps[safeIndex]

  return (
    <div className="space-y-3">
      <FieldLabel label={t('ruleEditor.sections.ctl')} hint={t('hints.sections.ctl')} />
      {rule.isChained && rule.steps.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {rule.steps.map((step, index) => (
            <Button
              key={step.id}
              type="button"
              variant={index === safeIndex ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveStepIndex(index)}
            >
              {index === 0 ? t('common.stepMain', { n: index + 1 }) : t('common.stepChain', { n: index + 1 })}
            </Button>
          ))}
        </div>
      ) : null}
      {activeStep ? (
        <CtlStepEditor
          stepId={activeStep.id}
          ctl={activeStep.ctl}
          rule={rule}
          onChange={onChange}
        />
      ) : null}
    </div>
  )
}
