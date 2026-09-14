"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface SelectOption<T extends string = string> {
  value: T
  label: string
}

interface FilterSelectProps<T extends string> {
  value: T
  onValueChange: (value: T) => void
  options: SelectOption<T>[]
  /** Visually de-emphasised until a non-default value is chosen. */
  defaultValue?: T
  /** Text shown before the value, e.g. "Sort". */
  prefix?: string
  className?: string
  align?: "start" | "center" | "end"
  size?: "sm" | "default"
}

/**
 * Compact select for toolbars (filters, sorting). Reads like a text control
 * rather than a form input so toolbars stay quiet.
 */
export function FilterSelect<T extends string>({
  value,
  onValueChange,
  options,
  defaultValue,
  prefix,
  className,
  align = "start",
  size = "sm",
}: FilterSelectProps<T>) {
  const isDefault = defaultValue !== undefined && value === defaultValue
  return (
    <Select
      value={value}
      onValueChange={(v) => v && onValueChange(v as T)}
      items={options}
    >
      <SelectTrigger
        size={size}
        className={cn(
          "gap-1 bg-transparent px-2.5 font-medium text-foreground hover:bg-muted data-popup-open:bg-muted",
          isDefault && "text-muted-foreground hover:text-foreground",
          className
        )}
      >
        {prefix && (
          <span className="font-normal text-muted-foreground">{prefix}</span>
        )}
        <SelectValue />
      </SelectTrigger>
      <SelectContent align={align} alignItemWithTrigger={false} className="min-w-44">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

interface FormSelectProps<T extends string> {
  id?: string
  value: T
  onValueChange: (value: T) => void
  options: SelectOption<T>[]
  placeholder?: string
  className?: string
}

/** Full-width select for forms. */
export function FormSelect<T extends string>({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  className,
}: FormSelectProps<T>) {
  return (
    <Select
      value={value}
      onValueChange={(v) => v && onValueChange(v as T)}
      items={options}
    >
      <SelectTrigger id={id} className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
