import { Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldLabel } from '@/components/common/FieldHint'
import { useTranslation } from '@/i18n'
import { createEmptyStep, syncChainAction } from '@/lib/ruleAdapters'
import type { ParsedRule } from '@/types/rules'

interface PhaseChainSectionProps {
  rule: ParsedRule
  onChange: (rule: ParsedRule) => void
}

export function PhaseChainSection({ rule, onChange }: PhaseChainSectionProps) {
  const { t } = useTranslation()

  const applyChange = (next: ParsedRule) => {
    onChange(syncChainAction(next))
  }

  const toggleChain = (checked: boolean) => {
    if (checked && rule.steps.length < 2) {
      applyChange({ ...rule, isChained: true, steps: [...rule.steps, createEmptyStep()] })
      return
    }
    applyChange({ ...rule, isChained: checked })
  }

  const removeStep = (stepId: string) => {
    const steps = rule.steps.filter((step) => step.id !== stepId)
    applyChange({ ...rule, steps, isChained: steps.length > 1 ? rule.isChained : false })
  }

  const addStep = () => {
    applyChange({ ...rule, isChained: true, steps: [...rule.steps, createEmptyStep()] })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-secondary text-secondary-foreground">{t('chain.currentPhase', { phase: rule.metadata.phase })}</Badge>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="chain-enabled" checked={rule.isChained} onCheckedChange={(value) => toggleChain(Boolean(value))} />
        <FieldLabel label={t('chain.enableChain')} hint={t('hints.sections.chain')} htmlFor="chain-enabled" />
      </div>
      <p className="text-xs text-muted-foreground">{t('chain.hint', { phase: rule.metadata.phase })}</p>
      <p className="text-xs text-muted-foreground">{t('chain.stepNotPhase')}</p>
      <div className="space-y-2">
        {rule.steps.map((step, index) => (
          <div key={step.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <span>
              {index === 0
                ? t('common.stepMain', { n: index + 1 })
                : t('common.stepChain', { n: index + 1 })}
            </span>
            {rule.steps.length > 1 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeStep(step.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addStep}>
        <Plus className="h-4 w-4" /> {t('chain.addStep')}
      </Button>
    </div>
  )
}
