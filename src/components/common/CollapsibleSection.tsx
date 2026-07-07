import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  title: string
  description?: string
  defaultOpen?: boolean
  children: ReactNode
}

export function CollapsibleSection({ title, description, defaultOpen = true, children }: CollapsibleSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="rounded-lg border bg-card">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className={cn('space-y-4 border-t px-4 py-4')}>{children}</CollapsibleContent>
    </Collapsible>
  )
}
