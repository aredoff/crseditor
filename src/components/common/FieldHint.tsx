import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface FieldHintProps {
  content: string
}

export function FieldHint({ content }: FieldHintProps) {
  if (!content) return null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex text-muted-foreground hover:text-foreground"
          aria-label="Help"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  )
}

interface FieldLabelProps {
  label: string
  hint?: string
  htmlFor?: string
}

export function FieldLabel({ label, hint, htmlFor }: FieldLabelProps) {
  return (
    <div className="flex items-center gap-1">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-sm font-medium leading-none">
          {label}
        </label>
      ) : (
        <span className="text-sm font-medium leading-none">{label}</span>
      )}
      {hint ? <FieldHint content={hint} /> : null}
    </div>
  )
}
