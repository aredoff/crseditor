import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { createEmptyRule, cloneRule } from '@/lib/ruleAdapters'
import { nextRuleId } from '@/lib/ruleId'
import { getValidationErrors, getValidationWarnings, validateRule } from '@/lib/validation'
import type { ParsedRule } from '@/types/rules'

export interface ImportRulesResult {
  imported: ParsedRule[]
  skippedDuplicateIds: number[]
  validationErrors: Array<{ id: number; message: string }>
  validationWarnings: Array<{ id: number; message: string }>
}

interface RulesStoreValue {
  rules: ParsedRule[]
  addRule: (rule?: ParsedRule) => string
  updateRule: (rule: ParsedRule) => void
  deleteRule: (internalId: string) => void
  duplicateRule: (internalId: string) => string | null
  importRules: (rules: ParsedRule[]) => ImportRulesResult
  getRule: (internalId: string) => ParsedRule | undefined
  isDraftRule: (internalId: string) => boolean
}

const RulesStoreContext = createContext<RulesStoreValue | null>(null)

export function RulesStoreProvider({ children }: { children: ReactNode }) {
  const [rules, setRules] = useState<ParsedRule[]>([])
  const [draftRuleIds, setDraftRuleIds] = useState<Set<string>>(() => new Set())

  const value = useMemo<RulesStoreValue>(() => ({
    rules,
    addRule: (rule) => {
      const created = rule ?? createEmptyRule(nextRuleId(rules))
      setRules((current) => [...current, created])
      setDraftRuleIds((current) => new Set(current).add(created.internalId))
      return created.internalId
    },
    updateRule: (rule) => {
      setRules((current) => current.map((item) => (item.internalId === rule.internalId ? rule : item)))
      setDraftRuleIds((current) => {
        if (!current.has(rule.internalId)) return current
        const next = new Set(current)
        next.delete(rule.internalId)
        return next
      })
    },
    deleteRule: (internalId) => {
      setRules((current) => current.filter((item) => item.internalId !== internalId))
      setDraftRuleIds((current) => {
        if (!current.has(internalId)) return current
        const next = new Set(current)
        next.delete(internalId)
        return next
      })
    },
    duplicateRule: (internalId) => {
      const source = rules.find((item) => item.internalId === internalId)
      if (!source) return null
      const copy = cloneRule(source, nextRuleId(rules))
      setRules((current) => [...current, copy])
      setDraftRuleIds((current) => new Set(current).add(copy.internalId))
      return copy.internalId
    },
    importRules: (incoming) => {
      const existingIds = new Set(rules.map((rule) => rule.metadata.id))
      const imported: ParsedRule[] = []
      const skippedDuplicateIds: number[] = []
      const validationErrors: Array<{ id: number; message: string }> = []
      const validationWarnings: Array<{ id: number; message: string }> = []

      for (const rule of incoming) {
        if (existingIds.has(rule.metadata.id) || imported.some((item) => item.metadata.id === rule.metadata.id)) {
          skippedDuplicateIds.push(rule.metadata.id)
          continue
        }

        const issues = validateRule(rule)
        for (const issue of getValidationErrors(issues)) {
          validationErrors.push({
            id: rule.metadata.id,
            message: issue.messageKey,
          })
        }
        for (const issue of getValidationWarnings(issues)) {
          validationWarnings.push({
            id: rule.metadata.id,
            message: issue.messageKey,
          })
        }

        imported.push(rule)
        existingIds.add(rule.metadata.id)
      }

      if (imported.length > 0) {
        setRules((current) => [...current, ...imported])
      }

      return { imported, skippedDuplicateIds, validationErrors, validationWarnings }
    },
    getRule: (internalId) => rules.find((item) => item.internalId === internalId),
    isDraftRule: (internalId) => draftRuleIds.has(internalId),
  }), [rules, draftRuleIds])

  return <RulesStoreContext.Provider value={value}>{children}</RulesStoreContext.Provider>
}

export function useRulesStore(): RulesStoreValue {
  const context = useContext(RulesStoreContext)
  if (!context) throw new Error('useRulesStore must be used within RulesStoreProvider')
  return context
}
