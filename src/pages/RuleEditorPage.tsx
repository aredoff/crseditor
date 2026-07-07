import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { RuleEditor } from '@/components/rule-editor/RuleEditor'
import { useRulesStore } from '@/state/rulesStore'

export function RuleEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getRule, updateRule, deleteRule, isDraftRule } = useRulesStore()
  const rule = id ? getRule(id) : undefined

  if (!rule) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="mx-auto max-w-[1600px] p-6">
      <RuleEditor
        rule={rule}
        onSave={(updatedRule) => {
          updateRule(updatedRule)
          navigate('/')
        }}
        onCancel={() => {
          if (isDraftRule(rule.internalId)) {
            deleteRule(rule.internalId)
          }
          navigate('/')
        }}
      />
    </div>
  )
}
