import { dump, load } from 'js-yaml'
import { extractParanoiaLevel, sortActionsByCrsOrder, syncParanoiaTag } from '@/constants/crsRuleSchema'
import type {
  ActionEntry,
  CollectionEntry,
  CtlEntry,
  ParsedRule,
  RuleMetadata,
  RuleStep,
  SetvarAction,
  VariableEntry,
} from '@/types/rules'

const CRS_REQUEST_ID_MAX = 949999
const CRS_RESPONSE_ID_MIN = 950000

function uid(): string {
  return crypto.randomUUID()
}

function createAction(category: ActionEntry['category'], key: string, extra?: Partial<ActionEntry>): ActionEntry {
  return { id: uid(), category, key, ...extra }
}

function defaultDetectionActions(): ActionEntry[] {
  return [
    createAction('disruptive', 'pass'),
    createAction('non-disruptive', 'log'),
    createAction('non-disruptive', 'setvar', {
      setvar: {
        collection: 'TX',
        operation: '=+',
        assignments: [{ variable: 'inbound_anomaly_score', value: '%{tx.critical_anomaly_score}' }],
      },
    }),
  ]
}

export function createEmptyStep(): RuleStep {
  return {
    id: uid(),
    variables: [],
    collections: [{ name: 'ARGS', arguments: [], excluded: [], count: false }],
    operator: { name: 'rx', value: '', negate: false },
    transformations: [],
    actions: [],
    ctl: [],
  }
}

export function createEmptyRule(id = 901000): ParsedRule {
  return {
    internalId: uid(),
    metadata: {
      id,
      phase: '2',
      message: '',
      severity: 'CRITICAL',
      ver: 'OWASP_CRS/4.0.0',
      tags: ['OWASP_CRS', 'application-multi', 'language-multi', 'platform-multi'],
      paranoiaLevel: '1',
    },
    isChained: false,
    steps: [{
      ...createEmptyStep(),
      actions: defaultDetectionActions(),
    }],
  }
}

export function getAllActions(rule: ParsedRule): ActionEntry[] {
  return rule.steps.flatMap((step) => step.actions)
}

export function getAllCtl(rule: ParsedRule): CtlEntry[] {
  return rule.steps.flatMap((step) => step.ctl)
}

export function syncChainAction(rule: ParsedRule): ParsedRule {
  const hasChainFlow = getAllActions(rule).some((action) => action.category === 'flow' && action.key === 'chain')
  let steps = rule.steps

  if (rule.isChained) {
    const chainAction = rule.steps[0]?.actions.find(
      (action) => action.category === 'flow' && action.key === 'chain',
    ) ?? createAction('flow', 'chain')
    steps = steps.map((step) => ({
      ...step,
      actions: step.actions.filter((action) => !(action.category === 'flow' && action.key === 'chain')),
    }))
    if (steps[0]) {
      steps[0] = {
        ...steps[0],
        actions: [...steps[0].actions, chainAction],
      }
    }
  } else if (hasChainFlow) {
    steps = steps.map((step) => ({
      ...step,
      actions: step.actions.filter((action) => !(action.category === 'flow' && action.key === 'chain')),
    }))
  }

  return { ...rule, steps }
}

function parseCtlValue(raw: string): CtlEntry {
  const directive = raw.includes('=') ? raw.split('=')[0] : raw
  return { id: uid(), key: directive, value: raw }
}

function parseOperator(raw: Record<string, unknown>) {
  if ('name' in raw) {
    return {
      name: String(raw.name ?? 'rx'),
      value: String(raw.value ?? ''),
      negate: Boolean(raw.negate),
    }
  }
  const entries = Object.entries(raw).filter(([key]) => key !== 'negate')
  const [name, value] = entries[0] ?? ['unconditionalMatch', '']
  return {
    name,
    value: value == null ? '' : String(value),
    negate: Boolean(raw.negate),
  }
}

function parseVariables(raw: unknown[]): VariableEntry[] {
  return raw.map((item) => {
    if (typeof item === 'string') return { name: item, excluded: false }
    const obj = item as Record<string, unknown>
    return {
      name: String(obj.name ?? ''),
      excluded: Boolean(obj.excluded),
    }
  })
}

function parseCollections(raw: unknown[]): CollectionEntry[] {
  return raw.map((item) => {
    const obj = item as Record<string, unknown>
    const excludedRaw = obj.excluded ?? obj.excludeds
    return {
      name: String(obj.name ?? 'ARGS'),
      arguments: Array.isArray(obj.arguments) ? obj.arguments.map(String) : [],
      excluded: Array.isArray(excludedRaw) ? excludedRaw.map(String) : [],
      count: Boolean(obj.count),
    }
  })
}

function parseSetvar(raw: unknown): SetvarAction {
  if (Array.isArray(raw)) {
    return {
      collection: 'TX',
      operation: '=',
      assignments: raw.flatMap((entry) => {
        if (typeof entry !== 'object' || entry == null) return []
        return Object.entries(entry as Record<string, string>).map(([variable, value]) => ({
          variable,
          value: String(value),
        }))
      }),
    }
  }
  const obj = raw as Record<string, unknown>
  const assignmentsRaw = obj.assignments
  const assignments = Array.isArray(assignmentsRaw)
    ? assignmentsRaw.flatMap((entry) => {
        if (typeof entry !== 'object' || entry == null) return []
        return Object.entries(entry as Record<string, string>).map(([variable, value]) => ({
          variable,
          value: String(value),
        }))
      })
    : []
  return {
    collection: String(obj.collection ?? 'TX'),
    operation: String(obj.operation ?? '='),
    assignments,
  }
}

function parseActions(raw: Record<string, unknown>): { actions: ActionEntry[]; ctl: CtlEntry[] } {
  const actions: ActionEntry[] = []
  const ctl: CtlEntry[] = []

  const disruptive = raw.disruptive
  if (typeof disruptive === 'string') {
    actions.push(createAction('disruptive', disruptive))
  } else if (disruptive && typeof disruptive === 'object') {
    const [key, param] = Object.entries(disruptive as Record<string, string>)[0] ?? ['pass', '']
    actions.push(createAction('disruptive', key, { param }))
  }

  const parseList = (items: unknown, category: ActionEntry['category']) => {
    if (!Array.isArray(items)) return
    for (const item of items) {
      if (typeof item === 'string') {
        actions.push(createAction(category, item))
        continue
      }
      const obj = item as Record<string, unknown>
      const [key, param] = Object.entries(obj)[0] ?? ['', '']
      if (key === 'setvar') {
        actions.push(createAction(category, 'setvar', { setvar: parseSetvar(param) }))
      } else if (key === 'ctl') {
        ctl.push(parseCtlValue(String(param)))
      } else {
        actions.push(createAction(category, key, { param: param == null ? undefined : String(param) }))
      }
    }
  }

  parseList(raw['non-disruptive'], 'non-disruptive')
  parseList(raw.flow, 'flow')
  parseList(raw.data, 'data')

  return { actions: sortActionsByCrsOrder(actions), ctl }
}

function getChainedRuleNode(raw: Record<string, unknown>): Record<string, unknown> | undefined {
  const chained = raw.chainedRule ?? raw['chained-rule']
  return chained && typeof chained === 'object' ? chained as Record<string, unknown> : undefined
}

function collectChainedActionSegments(raw: Record<string, unknown>): { actions: ActionEntry[]; ctl: CtlEntry[] }[] {
  const segments: { actions: ActionEntry[]; ctl: CtlEntry[] }[] = []
  let node = getChainedRuleNode(raw)
  while (node) {
    segments.push(parseActions((node.actions as Record<string, unknown>) ?? {}))
    const next = node.chainedRule ?? node['chained-rule']
    node = next && typeof next === 'object' ? next as Record<string, unknown> : undefined
  }
  return segments
}

function appendChainedConditions(steps: RuleStep[], raw: Record<string, unknown>): RuleStep[] {
  let node = getChainedRuleNode(raw)
  const result = [...steps]
  while (node) {
    const conditions = Array.isArray(node.conditions) ? node.conditions : []
    result.push(...conditions.map((c) => parseCondition(c as Record<string, unknown>)))
    const next = node.chainedRule ?? node['chained-rule']
    node = next && typeof next === 'object' ? next as Record<string, unknown> : undefined
  }
  return result
}

function assignStepActionsFromSegments(
  steps: RuleStep[],
  mainActions: ActionEntry[],
  mainCtl: CtlEntry[],
  segments: { actions: ActionEntry[]; ctl: CtlEntry[] }[],
): RuleStep[] {
  return steps.map((step, index) => {
    if (index === 0) {
      return { ...step, actions: sortActionsByCrsOrder(mainActions), ctl: mainCtl }
    }
    const segment = segments[index - 1]
    if (!segment) return step
    return {
      ...step,
      actions: sortActionsByCrsOrder(segment.actions),
      ctl: segment.ctl,
    }
  })
}

function distributeActionsToSteps(steps: RuleStep[], actions: ActionEntry[], ctl: CtlEntry[], isChained: boolean): RuleStep[] {
  if (steps.length === 0) return steps

  if (!isChained || steps.length === 1) {
    return steps.map((step, index) => (
      index === 0 ? { ...step, actions, ctl } : { ...step, actions: [], ctl: [] }
    ))
  }

  const firstActions: ActionEntry[] = []
  const middleActions: ActionEntry[] = []
  const lastActions: ActionEntry[] = []
  const lastCtl: CtlEntry[] = [...ctl]

  for (const action of actions) {
    if (action.category === 'disruptive' || action.category === 'flow') {
      firstActions.push(action)
      continue
    }
    if (action.key === 'ctl' || action.key === 'setvar') {
      lastActions.push(action)
      continue
    }
    if (action.category === 'data') {
      lastActions.push(action)
      continue
    }
    middleActions.push(action)
  }

  return steps.map((step, index) => {
    if (index === 0) {
      return { ...step, actions: sortActionsByCrsOrder(firstActions), ctl: [] }
    }
    if (index === steps.length - 1) {
      return {
        ...step,
        actions: sortActionsByCrsOrder([...middleActions, ...lastActions]),
        ctl: lastCtl,
      }
    }
    return { ...step, actions: sortActionsByCrsOrder(middleActions), ctl: [] }
  })
}

function parseMetadata(raw: Record<string, unknown>): RuleMetadata {
  const tags = Array.isArray(raw.tags) ? raw.tags.map(String) : undefined
  return {
    id: Number(raw.id ?? 0),
    phase: String(raw.phase ?? '2'),
    message: raw.message ? String(raw.message) : undefined,
    severity: raw.severity ? String(raw.severity) : undefined,
    rev: raw.rev ? String(raw.rev) : undefined,
    ver: raw.ver ? String(raw.ver) : undefined,
    maturity: raw.maturity ? String(raw.maturity) : undefined,
    accuracy: raw.accuracy ? String(raw.accuracy) : undefined,
    tags,
    comment: raw.comment ? String(raw.comment) : undefined,
    paranoiaLevel: extractParanoiaLevel(tags),
  }
}

function parseCondition(raw: Record<string, unknown>): RuleStep {
  return {
    id: uid(),
    variables: Array.isArray(raw.variables) ? parseVariables(raw.variables) : [],
    collections: Array.isArray(raw.collections) ? parseCollections(raw.collections) : [],
    operator: parseOperator((raw.operator as Record<string, unknown>) ?? { rx: '' }),
    transformations: Array.isArray(raw.transformations) ? raw.transformations.map(String) : [],
    actions: [],
    ctl: [],
  }
}

function parseDirective(raw: Record<string, unknown>): ParsedRule | null {
  if (raw.kind !== 'rule') return null
  const metadata = parseMetadata((raw.metadata as Record<string, unknown>) ?? {})
  const conditions = Array.isArray(raw.conditions) ? raw.conditions : []
  const { actions, ctl } = parseActions((raw.actions as Record<string, unknown>) ?? {})
  const flowKeys = actions.filter((a) => a.category === 'flow').map((a) => a.key)
  const chainedNode = getChainedRuleNode(raw)
  const baseSteps = conditions.length > 0
    ? conditions.map((c) => parseCondition(c as Record<string, unknown>))
    : [createEmptyStep()]
  const steps = chainedNode ? appendChainedConditions(baseSteps, raw) : baseSteps
  const isChained = flowKeys.includes('chain') || steps.length > 1
  const finalSteps = chainedNode
    ? assignStepActionsFromSegments(steps, actions, ctl, collectChainedActionSegments(raw))
    : distributeActionsToSteps(steps, actions, ctl, isChained)

  return {
    internalId: uid(),
    metadata,
    isChained,
    steps: finalSteps,
  }
}

export function yamlToParsedRules(content: string): ParsedRule[] {
  const parsed = load(content) as Record<string, unknown> | null
  if (!parsed || !Array.isArray(parsed.directivelist)) return []

  const rules: ParsedRule[] = []
  for (const group of parsed.directivelist as Record<string, unknown>[]) {
    const directives = Array.isArray(group.directives) ? group.directives : []
    for (const directive of directives) {
      const rule = parseDirective(directive as Record<string, unknown>)
      if (rule) rules.push(rule)
    }
  }
  return rules
}

function buildOperator(step: RuleStep): Record<string, unknown> {
  const operator: Record<string, unknown> = { [step.operator.name]: step.operator.value }
  if (step.operator.negate) operator.negate = true
  return operator
}

function buildCondition(step: RuleStep): Record<string, unknown> {
  const condition: Record<string, unknown> = {
    operator: buildOperator(step),
  }
  if (step.variables.length > 0) {
    condition.variables = step.variables.map((v) =>
      v.excluded ? { name: v.name, excluded: true } : v.name,
    )
  }
  if (step.collections.length > 0) {
    condition.collections = step.collections.map((c) => {
      const entry: Record<string, unknown> = { name: c.name }
      if (c.arguments.length > 0) entry.arguments = c.arguments
      if (c.excluded.length > 0) entry.excludeds = c.excluded
      if (c.count) entry.count = true
      return entry
    })
  }
  if (step.transformations.length > 0) condition.transformations = step.transformations
  return condition
}

function buildSetvarYaml(setvar: SetvarAction): unknown {
  if (setvar.collection === 'TX' && setvar.operation === '=') {
    return {
      setvar: setvar.assignments.map((a) => ({ [a.variable]: a.value })),
    }
  }
  return {
    setvar: {
      collection: setvar.collection,
      operation: setvar.operation,
      assignments: setvar.assignments.map((a) => ({ [a.variable]: a.value })),
    },
  }
}

function buildActionsYaml(rule: ParsedRule): Record<string, unknown> {
  const actions: Record<string, unknown> = {}
  const nonDisruptive: unknown[] = []
  const flow: unknown[] = []
  const data: unknown[] = []
  let disruptive: string | Record<string, unknown> | undefined

  const mergedActions = getAllActions(rule)
  const mergedCtl = getAllCtl(rule)

  for (const action of mergedActions) {
    if (action.category === 'disruptive') {
      disruptive = action.param ? { [action.key]: action.param } : action.key
      continue
    }
    if (action.key === 'setvar' && action.setvar) {
      nonDisruptive.push(buildSetvarYaml(action.setvar))
      continue
    }
    const target = action.category === 'flow' ? flow : action.category === 'data' ? data : nonDisruptive
    target.push(action.param ? { [action.key]: action.param } : action.key)
  }

  for (const ctl of mergedCtl) {
    const ctlIndex = nonDisruptive.findIndex((item) => {
      if (typeof item !== 'object' || item == null) return false
      return 'ctl' in (item as Record<string, unknown>)
    })
    const ctlEntry = { ctl: ctl.value }
    if (ctlIndex === -1) {
      const setvarIndex = nonDisruptive.findIndex((item) => {
        if (typeof item !== 'object' || item == null) return false
        return 'setvar' in (item as Record<string, unknown>)
      })
      if (setvarIndex === -1) nonDisruptive.push(ctlEntry)
      else nonDisruptive.splice(setvarIndex, 0, ctlEntry)
    } else {
      nonDisruptive.splice(ctlIndex, 0, ctlEntry)
    }
  }

  if (rule.isChained && !flow.some((item) => typeof item === 'string' && item === 'chain')) {
    flow.push('chain')
  }

  if (disruptive != null) actions.disruptive = disruptive
  if (nonDisruptive.length > 0) actions['non-disruptive'] = nonDisruptive
  if (flow.length > 0) actions.flow = flow
  if (data.length > 0) actions.data = data
  return actions
}

function buildActionsYamlFromSteps(
  steps: RuleStep[],
  options: { isChained: boolean; addChainFlow: boolean },
): Record<string, unknown> {
  const pseudoRule: ParsedRule = {
    internalId: '',
    metadata: { id: 0, phase: '1' },
    isChained: options.isChained,
    steps,
  }
  const actions = buildActionsYaml(pseudoRule)
  if (!options.addChainFlow && Array.isArray(actions.flow)) {
    const flow = actions.flow.filter((item) => item !== 'chain')
    if (flow.length > 0) actions.flow = flow
    else delete actions.flow
  }
  return actions
}

function buildChainedRuleYaml(steps: RuleStep[]): Record<string, unknown> | undefined {
  if (steps.length === 0) return undefined
  const [first, ...rest] = steps
  const node: Record<string, unknown> = {
    kind: 'rule',
    conditions: [buildCondition(first)],
    actions: buildActionsYamlFromSteps([first], { isChained: true, addChainFlow: rest.length > 0 }),
  }
  const nested = buildChainedRuleYaml(rest)
  if (nested) node.chainedRule = nested
  return node
}

function buildDirectiveYaml(prepared: ParsedRule): Record<string, unknown> {
  if (prepared.isChained && prepared.steps.length > 1) {
    const [first, ...rest] = prepared.steps
    const directive: Record<string, unknown> = {
      kind: 'rule',
      metadata: buildMetadataYaml(prepared.metadata),
      conditions: [buildCondition(first)],
      actions: buildActionsYamlFromSteps([first], { isChained: true, addChainFlow: true }),
    }
    const chained = buildChainedRuleYaml(rest)
    if (chained) directive.chainedRule = chained
    return directive
  }

  return {
    kind: 'rule',
    metadata: buildMetadataYaml(prepared.metadata),
    conditions: prepared.steps.map(buildCondition),
    actions: buildActionsYaml(prepared),
  }
}

function buildMetadataYaml(metadata: RuleMetadata): Record<string, unknown> {
  const tags = syncParanoiaTag(metadata.tags, metadata.paranoiaLevel)
  const result: Record<string, unknown> = {
    phase: metadata.phase,
    id: metadata.id,
  }
  if (metadata.message) result.message = metadata.message
  if (metadata.severity) result.severity = metadata.severity
  if (metadata.rev) result.rev = metadata.rev
  if (metadata.ver) result.ver = metadata.ver
  if (metadata.maturity) result.maturity = metadata.maturity
  if (metadata.accuracy) result.accuracy = metadata.accuracy
  if (tags.length > 0) result.tags = tags
  if (metadata.comment) result.comment = metadata.comment
  return result
}

export function prepareRuleForExport(rule: ParsedRule): ParsedRule {
  return syncChainAction(rule)
}

export function parsedRulesToYaml(rules: ParsedRule[]): string {
  const directives = rules.map((rule) => buildDirectiveYaml(prepareRuleForExport(rule)))

  return dump({ directivelist: [{ id: 'editor', directives }] }, {
    lineWidth: 120,
    noRefs: true,
  })
}

export function parsedRuleToSingleYaml(rule: ParsedRule): string {
  return parsedRulesToYaml([rule])
}

export function getRuleDescription(
  rule: ParsedRule,
  t?: (key: string, params?: Record<string, string | number>) => string,
): string {
  if (rule.metadata.message?.trim()) return rule.metadata.message.trim()
  if (t) return t('ruleDescription.fallback', { id: rule.metadata.id })
  return `Rule ${rule.metadata.id}`
}

export function cloneRule(rule: ParsedRule, newId: number): ParsedRule {
  return structuredClone({
    ...rule,
    internalId: uid(),
    metadata: { ...rule.metadata, id: newId },
  })
}

export function isRequestPhase(phase: string): boolean {
  return phase === '1' || phase === '2'
}

export function isResponsePhase(phase: string): boolean {
  return phase === '3' || phase === '4'
}

export function isRequestId(id: number): boolean {
  return id >= 900000 && id <= CRS_REQUEST_ID_MAX
}

export function isResponseId(id: number): boolean {
  return id >= CRS_RESPONSE_ID_MIN && id <= 999999
}
