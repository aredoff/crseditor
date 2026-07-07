import type { NamedGroup, OperatorGroup } from '@/constants/crsRuleSchema'
import { operatorLabel } from '@/constants/crsRuleSchema'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'

interface GroupedStringSelectProps {
  value?: string
  groups: readonly NamedGroup[]
  placeholder?: string
  getGroupLabel: (groupId: string) => string
  onValueChange: (value: string) => void
}

export function GroupedStringSelect({
  value,
  groups,
  placeholder,
  getGroupLabel,
  onValueChange,
}: GroupedStringSelectProps) {
  return (
    <Select value={value || undefined} onValueChange={onValueChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {groups.map((group) => (
          <SelectGroup key={group.id}>
            <SelectLabel>{getGroupLabel(group.id)}</SelectLabel>
            {group.items.map((item) => (
              <SelectItem key={item} value={item}>{item}</SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}

interface GroupedOperatorSelectProps {
  value: string
  groups: readonly OperatorGroup[]
  getGroupLabel: (groupId: string) => string
  onValueChange: (value: string) => void
}

export function GroupedOperatorSelect({
  value,
  groups,
  getGroupLabel,
  onValueChange,
}: GroupedOperatorSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        {groups.map((group) => (
          <SelectGroup key={group.id}>
            <SelectLabel>{getGroupLabel(group.id)}</SelectLabel>
            {group.items.map((item) => (
              <SelectItem key={item.name} value={item.name}>{operatorLabel(item.name)}</SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}
