export interface CorazaDataFile {
  name: string
  content: string
}

export interface CorazaTestResult {
  transaction_id: string
  collections: string
  matched_data: string
  rules_matched_total: string
  audit_log: string
  disruptive_action: string
  disruptive_rule: string
  disruptive_status: number
  duration: number
  engine_status: string
  error?: string
}

export type CorazaRuleMatch = [string, string]

export type CorazaCollection = [string, string, string, string]

export interface CorazaAnalysisResult {
  transactionId: string
  disruptiveAction: string
  disruptiveRule: string
  disruptiveStatus: number
  matchedRules: CorazaRuleMatch[]
  collections: CorazaCollection[]
  auditLog: string
  duration: number
  engineStatus: string
  rulesMatchedTotal: string
}
