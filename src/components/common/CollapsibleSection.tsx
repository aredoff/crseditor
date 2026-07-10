import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  title: string
  description?: string
  defaultOpen?: boolean
  variant?: 'card' | 'plain'
  children: ReactNode
}

export function CollapsibleSection({
  title,
  description,
  defaultOpen = true,
  variant = 'card',
  children,
}: CollapsibleSectionProps) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className={cn(
        variant === 'card' && 'rounded-lg border bg-card',
        variant === 'plain' && 'rounded-md border border-border bg-muted',
      )}
    >
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between px-4 py-3 text-left transition-colors',
          variant === 'plain' && 'rounded-t-md hover:bg-accent/60 data-[state=open]:bg-accent/60',
        )}
      >
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description ? (
            <p
              className={cn(
                'text-xs',
                variant === 'card' ? 'text-muted-foreground' : 'text-foreground/70',
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'space-y-4 px-4 py-4',
          variant === 'card' && 'border-t',
          variant === 'plain' && 'border-t border-border',
        )}
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}
