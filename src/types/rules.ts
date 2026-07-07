export interface RuleMetadata {
  id: number
  phase: string
  message?: string
  severity?: string
  rev?: string
  ver?: string
  maturity?: string
  accuracy?: string
  tags?: string[]
  comment?: string
  paranoiaLevel?: '1' | '2' | '3' | '4'
}

export interface VariableEntry {
  name: string
  excluded: boolean
}

export interface CollectionEntry {
  name: string
  arguments: string[]
  excluded: string[]
  count: boolean
}

export interface OperatorEntry {
  name: string
  value: string
  negate: boolean
}

export interface SetvarAssignment {
  variable: string
  value: string
}

export interface SetvarAction {
  collection: string
  operation: string
  assignments: SetvarAssignment[]
}

export type ActionCategory = 'disruptive' | 'non-disruptive' | 'flow' | 'data'

export interface ActionEntry {
  id: string
  category: ActionCategory
  key: string
  param?: string
  setvar?: SetvarAction
}

export interface CtlEntry {
  id: string
  key: string
  value: string
}

export interface RuleStep {
  id: string
  variables: VariableEntry[]
  collections: CollectionEntry[]
  operator: OperatorEntry
  transformations: string[]
  actions: ActionEntry[]
  ctl: CtlEntry[]
}

export interface ParsedRule {
  internalId: string
  metadata: RuleMetadata
  isChained: boolean
  steps: RuleStep[]
}

export type WasmResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export type ExportFormat = 'crslang' | 'seclang'
