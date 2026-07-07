import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

export function TooltipProvider({
  delayDuration = 200,
  ...props
}: TooltipPrimitive.TooltipProviderProps) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />
}

export function Tooltip({ ...props }: TooltipPrimitive.TooltipProps) {
  return <TooltipPrimitive.Root {...props} />
}

export function TooltipTrigger({
  className,
  ...props
}: TooltipPrimitive.TooltipTriggerProps) {
  return (
    <TooltipPrimitive.Trigger
      className={cn('inline-flex', className)}
      {...props}
    />
  )
}

export function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: TooltipPrimitive.TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-w-sm rounded-md border bg-card px-3 py-2 text-xs text-card-foreground shadow-md animate-in fade-in-0 zoom-in-95',
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}
