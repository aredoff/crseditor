import {
  getAllActions,
  getAllCtl,
  isRequestId,
  isRequestPhase,
  isResponseId,
  isResponsePhase,
} from '@/lib/ruleAdapters'
import { getOperatorMeta, isKnownIdRange, PARANOIA_LEVELS } from '@/constants/crsRuleSchema'
import type { ParsedRule, RuleStep } from '@/types/rules'

export interface ValidationIssue {
  field: string
  messageKey: string
  messageParams?: Record<string, string | number>
  severity: 'error' | 'warning'
}

const RX_FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; construct: string }> = [
  { pattern: /\(\?[=!<]/, construct: 'lookahead/lookbehind' },
  { pattern: /\(\?>/, construct: 'atomic group (?>...)' },
  { pattern: /\+\+/, construct: 'possessive quantifier (++)' },
  { pattern: /\\\d/, construct: 'backreference (\\1)' },
]

export function validateRule(rule: ParsedRule): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (!Number.isFinite(rule.metadata.id) || rule.metadata.id <= 0) {
    issues.push({ field: 'metadata.id', messageKey: 'validation.idRequired', severity: 'error' })
  } else if (!isKnownIdRange(rule.metadata.id)) {
    issues.push({
      field: 'metadata.id',
      messageKey: 'validation.idOutOfRange',
      severity: 'warning',
    })
  }

  if (isRequestPhase(rule.metadata.phase) && rule.metadata.id >= 900000 && !isRequestId(rule.metadata.id)) {
    issues.push({
      field: 'metadata.id',
      messageKey: 'validation.idRequestPhaseMismatch',
      messageParams: { id: rule.metadata.id },
      severity: 'warning',
    })
  }

  if (isResponsePhase(rule.metadata.phase) && rule.metadata.id >= 900000 && !isResponseId(rule.metadata.id)) {
    issues.push({
      field: 'metadata.id',
      messageKey: 'validation.idResponsePhaseMismatch',
      messageParams: { id: rule.metadata.id },
      severity: 'warning',
    })
  }

  if (!['1', '2', '3', '4', '5'].includes(rule.metadata.phase)) {
    issues.push({ field: 'metadata.phase', messageKey: 'validation.phaseInvalid', severity: 'error' })
  }

  if (rule.metadata.phase === '5') {
    issues.push({ field: 'metadata.phase', messageKey: 'validation.phase5RareInCrs', severity: 'warning' })
  }

  for (const tag of rule.metadata.tags ?? []) {
    if (tag.startsWith('paranoia-level/')) {
      const level = tag.split('/')[1]
      if (!PARANOIA_LEVELS.includes(level as typeof PARANOIA_LEVELS[number])) {
        issues.push({
          field: 'metadata.tags',
          messageKey: 'validation.invalidParanoiaTag',
          messageParams: { tag },
          severity: 'error',
        })
      }
    }
  }

  if (rule.metadata.paranoiaLevel) {
    const expected = `paranoia-level/${rule.metadata.paranoiaLevel}`
    const hasTag = rule.metadata.tags?.includes(expected)
    if (!hasTag) {
      issues.push({
        field: 'metadata.tags',
        messageKey: 'validation.paranoiaTagMissing',
        messageParams: { level: rule.metadata.paranoiaLevel },
        severity: 'warning',
      })
    }
    const mismatch = rule.metadata.tags?.find((tag) => tag.startsWith('paranoia-level/') && tag !== expected)
    if (mismatch) {
      issues.push({
        field: 'metadata.paranoiaLevel',
        messageKey: 'validation.paranoiaMismatch',
        messageParams: { expected, tag: mismatch },
        severity: 'warning',
      })
    }
  }

  const hasNolog = getAllActions(rule).some((action) => action.key === 'nolog')
  if (hasNolog && rule.metadata.tags?.some((tag) => tag.startsWith('paranoia-level/'))) {
    issues.push({ field: 'metadata.tags', messageKey: 'validation.paranoiaTagWithNolog', severity: 'warning' })
  }

  if (rule.steps.length === 0) {
    issues.push({ field: 'steps', messageKey: 'validation.stepsRequired', severity: 'error' })
  }

  rule.steps.forEach((step, index) => {
    issues.push(...validateStep(step, index))
  })

  if (rule.isChained && rule.steps.length < 2) {
    issues.push({ field: 'steps', messageKey: 'validation.chainStepsRequired', severity: 'error' })
  }

  if (rule.isChained && rule.metadata.paranoiaLevel === '1') {
    issues.push({ field: 'isChained', messageKey: 'validation.pl1ChainNotRecommended', severity: 'warning' })
  }

  if (rule.isChained && getAllCtl(rule).length > 0) {
    issues.push({ field: 'ctl', messageKey: 'validation.ctlOnChainedRule', severity: 'warning' })
  }

  const disruptive = getAllActions(rule).filter((action) => action.category === 'disruptive')
  if (disruptive.length !== 1) {
    issues.push({ field: 'actions.disruptive', messageKey: 'validation.disruptiveRequired', severity: 'error' })
  }

  const hasSetvar = getAllActions(rule).some((action) => action.key === 'setvar')
  const blocking = disruptive.some((action) => ['deny', 'drop', 'block'].includes(action.key))
  if (blocking && !hasSetvar) {
    issues.push({ field: 'actions.disruptive', messageKey: 'validation.blockingNotAnomalyScoring', severity: 'warning' })
  }

  return issues
}

function validateStep(step: RuleStep, index: number): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const prefix = `steps[${index}]`

  if (step.variables.length === 0 && step.collections.length === 0) {
    issues.push({ field: prefix, messageKey: 'validation.stepTargetRequired', severity: 'error' })
  }

  const operator = getOperatorMeta(step.operator.name)
  if (operator.hasArg && !step.operator.value.trim()) {
    issues.push({
      field: `${prefix}.operator`,
      messageKey: 'validation.operatorArgRequired',
      messageParams: { operator: `@${operator.name}` },
      severity: 'error',
    })
  }

  if (step.operator.name === 'rx' && step.operator.value.trim()) {
    for (const { pattern, construct } of RX_FORBIDDEN_PATTERNS) {
      if (pattern.test(step.operator.value)) {
        issues.push({
          field: `${prefix}.operator`,
          messageKey: 'validation.rxForbiddenConstruct',
          messageParams: { construct },
          severity: 'error',
        })
        break
      }
    }
  }

  return issues
}

export function getValidationErrors(issues: ValidationIssue[]): ValidationIssue[] {
  return issues.filter((issue) => issue.severity === 'error')
}

export function getValidationWarnings(issues: ValidationIssue[]): ValidationIssue[] {
  return issues.filter((issue) => issue.severity === 'warning')
}
