import type { ParsedRule } from '@/types/rules'

const CRS_DEFAULT_ID = 901000
const CRS_ID_STEP = 10

export function nextRuleId(rules: ParsedRule[]): number {
  const ids = rules.map((rule) => rule.metadata.id).filter((id) => Number.isFinite(id))
  if (ids.length === 0) return CRS_DEFAULT_ID
  const max = Math.max(...ids)
  if (max < 900000) return CRS_DEFAULT_ID
  return max + CRS_ID_STEP
}
