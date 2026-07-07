import { useState } from 'react'
import { GroupedStringSelect } from '@/components/common/GroupedSelect'
import { ArrowDown, ArrowUp, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TRANSFORMATION_GROUPS } from '@/constants/crsRuleSchema'
import { useTranslation } from '@/i18n'
import type { ParsedRule, RuleStep } from '@/types/rules'

interface TransformationsSectionProps {
  rule: ParsedRule
  onChange: (rule: ParsedRule) => void
}

function updateStep(rule: ParsedRule, stepId: string, updater: (step: RuleStep) => RuleStep): ParsedRule {
  return {
    ...rule,
    steps: rule.steps.map((step) => (step.id === stepId ? updater(step) : step)),
  }
}

function AddTransformationPicker({
  onAdd,
  t,
}: {
  onAdd: (value: string) => void
  t: (key: string) => string
}) {
  const [key, setKey] = useState(0)
  return (
    <GroupedStringSelect
      key={key}
      value=""
      groups={TRANSFORMATION_GROUPS}
      placeholder={t('transformations.addTransformation')}
      getGroupLabel={(id) => t(`schema.transformationGroups.${id}`)}
      onValueChange={(value) => {
        onAdd(value)
        setKey((current) => current + 1)
      }}
    />
  )
}

export function TransformationsSection({ rule, onChange }: TransformationsSectionProps) {
  const { t } = useTranslation()

  const moveTransformation = (stepId: string, index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    onChange(updateStep(rule, stepId, (current) => {
      if (nextIndex < 0 || nextIndex >= current.transformations.length) return current
      const next = [...current.transformations]
      ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
      return { ...current, transformations: next }
    }))
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">{t('transformations.hint')}</p>
      {rule.steps.map((step, index) => (
        <div key={step.id} className="space-y-3 rounded-md border p-3">
          <h4 className="text-sm font-medium">{t('common.step', { n: index + 1 })}</h4>
          {step.transformations.length > 0 ? (
            <div className="space-y-2">
              {step.transformations.map((transformation, transIndex) => (
                <div
                  key={`${step.id}-${transIndex}-${transformation}`}
                  className="flex items-center gap-1 rounded-md border px-3 py-2"
                >
                  <span className="flex-1 font-mono text-sm">{transformation}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={transIndex === 0}
                    onClick={() => moveTransformation(step.id, transIndex, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={transIndex >= step.transformations.length - 1}
                    onClick={() => moveTransformation(step.id, transIndex, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange(updateStep(rule, step.id, (current) => ({
                      ...current,
                      transformations: current.transformations.filter((_, idx) => idx !== transIndex),
                    })))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-[240px]">
              <AddTransformationPicker
                t={t}
                onAdd={(value) => onChange(updateStep(rule, step.id, (current) => ({
                  ...current,
                  transformations: [...current.transformations, value],
                })))}
              />
            </div>
            {step.transformations.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange(updateStep(rule, step.id, (current) => ({
                  ...current,
                  transformations: [],
                })))}
              >
                <Trash2 className="h-4 w-4" /> {t('transformations.clear')}
              </Button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
