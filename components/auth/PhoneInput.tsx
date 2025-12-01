"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { PhoneInput as ShadcnPhoneInput } from "@/components/ui/phone-input"
import type { Value } from "react-phone-number-input"

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  className?: string
}

function PhoneInput({
  value,
  onChange,
  error,
  disabled,
  className,
}: PhoneInputProps) {
  return (
    <div className={cn("relative", className)}>
      <ShadcnPhoneInput
        value={value as Value}
        onChange={(newValue) => onChange(newValue || "")}
        defaultCountry="CI"
        disabled={disabled}
        placeholder="07 00 00 00 00"
        className={cn(
          error && "[&_input]:border-destructive [&_input]:focus-visible:ring-destructive"
        )}
        aria-invalid={!!error}
      />
      {error && (
        <p className="mt-1.5 text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

export { PhoneInput }
