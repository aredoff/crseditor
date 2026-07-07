import { useState } from 'react'
import { ArrowDown, ArrowUp, ListOrdered, Plus, Trash2 } from 'lucide-react'
import { FieldLabel } from '@/components/common/FieldHint'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ACTION_GROUPS,
  actionRequiresParam,
  SETVAR_COLLECTIONS,
  SETVAR_OPERATIONS,
  sortActionsByCrsOrder,
} from '@/constants/crsRuleSchema'
import { useTranslation } from '@/i18n'
import { syncChainAction } from '@/lib/ruleAdapters'
import type { ActionEntry, ParsedRule, RuleStep, SetvarAction } from '@/types/rules'

interface ActionsSectionProps {
  rule: ParsedRule
  onChange: (rule: ParsedRule) => void
}

function createAction(category: ActionEntry['category'], key: string): ActionEntry {
  return { id: crypto.randomUUID(), category, key }
}

function updateStepActions(
  rule: ParsedRule,
  stepId: string,
  updater: (actions: ActionEntry[]) => ActionEntry[],
): ParsedRule {
  return syncChainAction({
    ...rule,
    steps: rule.steps.map((step) => (
      step.id === stepId ? { ...step, actions: updater(step.actions) } : step
    )),
  })
}

function SetvarEditor({
  value,
  onChange,
  t,
}: {
  value?: SetvarAction
  onChange: (value: SetvarAction) => void
  t: (key: string) => string
}) {
  const current = value ?? { collection: 'TX', operation: '=', assignments: [{ variable: '', value: '' }] }
  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="grid gap-2 md:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel label={t('actions.collection')} />
          <Select value={current.collection} onValueChange={(collection) => onChange({ ...current, collection })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SETVAR_COLLECTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <FieldLabel label={t('actions.operation')} />
          <Select value={current.operation} onValueChange={(operation) => onChange({ ...current, operation })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SETVAR_OPERATIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {current.assignments.map((assignment, index) => (
        <div key={`${assignment.variable}-${index}`} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          <Input
            placeholder={t('actions.variablePlaceholder')}
            value={assignment.variable}
            onChange={(event) => onChange({
              ...current,
              assignments: current.assignments.map((item, idx) => (
                idx === index ? { ...item, variable: event.target.value } : item
              )),
            })}
          />
          <Input
            placeholder={t('actions.valuePlaceholder')}
            value={assignment.value}
            onChange={(event) => onChange({
              ...current,
              assignments: current.assignments.map((item, idx) => (
                idx === index ? { ...item, value: event.target.value } : item
              )),
            })}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({
              ...current,
              assignments: current.assignments.filter((_, idx) => idx !== index),
            })}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange({
          ...current,
          assignments: [...current.assignments, { variable: '', value: '' }],
        })}
      >
        <Plus className="h-4 w-4" /> {t('actions.addAssignment')}
      </Button>
    </div>
  )
}

const categoryLabels: Record<ActionEntry['category'], string> = {
  disruptive: 'actions.disruptive',
  flow: 'actions.flow',
  data: 'actions.data',
  'non-disruptive': 'actions.nonDisruptive',
}

const addableGroups = ACTION_GROUPS.map((group) => (
  group.id === 'flow'
    ? { ...group, items: group.items.filter((item) => item !== 'chain') }
    : group
))

function StepActionsEditor({
  step,
  stepIndex,
  rule,
  onChange,
}: {
  step: RuleStep
  stepIndex: number
  rule: ParsedRule
  onChange: (rule: ParsedRule) => void
}) {
  const { t } = useTranslation()

  const updateAction = (actionId: string, patch: Partial<ActionEntry>) => {
    onChange(updateStepActions(rule, step.id, (actions) =>
      actions.map((action) => (action.id === actionId ? { ...action, ...patch } : action)),
    ))
  }

  const moveAction = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= step.actions.length) return
    onChange(updateStepActions(rule, step.id, (actions) => {
      const next = [...actions]
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)
      return next
    }))
  }

  const paramPlaceholder = (key: string) => {
    const translated = t(`schema.actionParams.${key}`)
    return translated === `schema.actionParams.${key}` ? t('actions.actionParamPlaceholder') : translated
  }

  return (
    <div className="space-y-3">
      {rule.isChained ? (
        <p className="text-xs font-medium text-muted-foreground">
          {stepIndex === 0 ? t('common.stepMain', { n: stepIndex + 1 }) : t('common.stepChain', { n: stepIndex + 1 })}
        </p>
      ) : null}
      {step.actions.map((action, index) => (
        <div key={action.id} className="space-y-3 rounded-md border p-3">
          <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto_auto_auto]">
            <Select
              value={action.category}
              onValueChange={(value) => {
                const group = ACTION_GROUPS.find((item) => item.category === value)
                const firstItem = group?.items.find((item) => item !== 'chain') ?? group?.items[0] ?? action.key
                updateAction(action.id, {
                  category: value as ActionEntry['category'],
                  key: firstItem,
                  param: undefined,
                  setvar: undefined,
                })
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(categoryLabels) as ActionEntry['category'][]).map((category) => (
                  <SelectItem key={category} value={category}>{t(categoryLabels[category])}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={action.key}
              onValueChange={(value) => updateAction(action.id, { key: value, param: undefined, setvar: undefined })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTION_GROUPS
                  .filter((group) => group.category === action.category)
                  .map((group) => (
                    <SelectGroup key={group.id}>
                      <SelectLabel>{t(`schema.actionGroups.${group.id}`)}</SelectLabel>
                      {group.items
                        .filter((item) => !(action.category === 'flow' && item === 'chain'))
                        .map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                    </SelectGroup>
                  ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="ghost" size="sm" onClick={() => moveAction(index, -1)}><ArrowUp className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => moveAction(index, 1)}><ArrowDown className="h-4 w-4" /></Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={action.category === 'flow' && action.key === 'chain'}
              onClick={() => onChange(updateStepActions(rule, step.id, (actions) =>
                actions.filter((item) => item.id !== action.id),
              ))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {action.key === 'setvar' ? (
            <SetvarEditor
              value={action.setvar}
              onChange={(setvar) => updateAction(action.id, { setvar })}
              t={t}
            />
          ) : actionRequiresParam(action.key) ? (
            <div className="space-y-2">
              <FieldLabel label={t('actions.parameter')} />
              <Input
                value={action.param ?? ''}
                onChange={(event) => updateAction(action.id, { param: event.target.value })}
                placeholder={paramPlaceholder(action.key)}
              />
            </div>
          ) : null}
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {addableGroups.map((group) => (
          <Button
            key={group.id}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(updateStepActions(rule, step.id, (actions) => [
              ...actions,
              createAction(group.category, group.items[0]),
            ]))}
          >
            <Plus className="h-4 w-4" /> {t(`schema.actionGroups.${group.id}`)}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function ActionsSection({ rule, onChange }: ActionsSectionProps) {
  const { t } = useTranslation()
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const safeIndex = Math.min(activeStepIndex, Math.max(rule.steps.length - 1, 0))
  const activeStep = rule.steps[safeIndex]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel label={t('ruleEditor.sections.actions')} hint={t('hints.sections.actions')} />
        {activeStep ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(updateStepActions(rule, activeStep.id, sortActionsByCrsOrder))}
          >
            <ListOrdered className="h-4 w-4" /> {t('actions.sortByCrs')}
          </Button>
        ) : null}
      </div>
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
        <StepActionsEditor
          step={activeStep}
          stepIndex={safeIndex}
          rule={rule}
          onChange={onChange}
        />
      ) : null}
    </div>
  )
}
