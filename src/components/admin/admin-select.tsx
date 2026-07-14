import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { cn } from '#/lib/utils'

/** Radix Select cannot use an empty string as item value. */
export const ADMIN_SELECT_EMPTY = '__formos_empty__'

export function AdminSelect({
  value,
  onValueChange,
  options,
  placeholder,
  triggerClassName,
  size = 'sm',
}: {
  value: string
  onValueChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  triggerClassName?: string
  size?: 'sm' | 'default'
}) {
  const normalized = value || ADMIN_SELECT_EMPTY

  return (
    <Select
      value={normalized}
      onValueChange={(next) =>
        onValueChange(next === ADMIN_SELECT_EMPTY ? '' : next)
      }
    >
      <SelectTrigger size={size} className={cn('min-w-[8.5rem]', triggerClassName)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => {
          const itemValue = option.value || ADMIN_SELECT_EMPTY
          return (
            <SelectItem key={itemValue} value={itemValue}>
              {option.label}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
