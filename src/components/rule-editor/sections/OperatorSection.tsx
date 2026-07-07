import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { FieldLabel } from '@/components/common/FieldHint'
import { GroupedOperatorSelect } from '@/components/common/GroupedSelect'
import { getOperatorMeta, OPERATOR_GROUPS } from '@/constants/crsRuleSchema'
import { useTranslation } from '@/i18n'
import type { ParsedRule, RuleStep } from '@/types/rules'

interface OperatorSectionProps {
  rule: ParsedRule
  onChange: (rule: ParsedRule) => void
}

function updateStep(rule: ParsedRule, stepId: string, updater: (step: RuleStep) => RuleStep): ParsedRule {
  return {
    ...rule,
    steps: rule.steps.map((step) => (step.id === stepId ? updater(step) : step)),
  }
}

export function OperatorSection({ rule, onChange }: OperatorSectionProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      {rule.steps.map((step, index) => {
        const meta = getOperatorMeta(step.operator.name)
        return (
          <div key={step.id} className="space-y-3 rounded-md border p-3">
            <h4 className="text-sm font-medium">{t('common.step', { n: index + 1 })}</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel label={t('operator.label')} />
                <GroupedOperatorSelect
                  value={step.operator.name}
                  groups={OPERATOR_GROUPS}
                  getGroupLabel={(id) => t(`schema.operatorGroups.${id}`)}
                  onValueChange={(value) => onChange(updateStep(rule, step.id, (current) => ({
                    ...current,
                    operator: { ...current.operator, name: value },
                  })))}
                />
                <p className="text-xs text-muted-foreground">
                  {t(`schema.operators.${meta.name}`)}
                </p>
              </div>
              <div className="space-y-2">
                <FieldLabel label={t('operator.argument')} />
                <Input
                  value={step.operator.value}
                  disabled={!meta.hasArg}
                  onChange={(event) => onChange(updateStep(rule, step.id, (current) => ({
                    ...current,
                    operator: { ...current.operator, value: event.target.value },
                  })))}
                  placeholder={meta.hasArg ? t('operator.argumentPlaceholder') : t('operator.noArgument')}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={step.operator.negate}
                onCheckedChange={(value) => onChange(updateStep(rule, step.id, (current) => ({
                  ...current,
                  operator: { ...current.operator, negate: Boolean(value) },
                })))}
              />
              {t('operator.negate')}
            </label>
          </div>
        )
      })}
    </div>
  )
}
