"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface PhoneInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  value: string
  onChange: (value: string) => void
  error?: string
}

// Format digits for display: XX XX XX XX XX
function formatForDisplay(digits: string): string {
  const cleaned = digits.replace(/\D/g, "").slice(0, 10)
  const parts = []
  for (let i = 0; i < cleaned.length; i += 2) {
    parts.push(cleaned.slice(i, i + 2))
  }
  return parts.join(" ")
}

// Extract digits from formatted value
function extractDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10)
}

function PhoneInput({
  value,
  onChange,
  error,
  className,
  disabled,
  ...props
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Initialize display value from normalized value
  React.useEffect(() => {
    const digits = value.replace(/^\+225/, "").replace(/\D/g, "")
    setDisplayValue(formatForDisplay(digits))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const digits = extractDigits(input)
    const formatted = formatForDisplay(digits)
    setDisplayValue(formatted)

    // Store as normalized +225XXXXXXXXXX
    if (digits.length > 0) {
      onChange(`+225${digits}`)
    } else {
      onChange("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter
    if (
      [8, 46, 9, 27, 13].includes(e.keyCode) ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey) ||
      (e.keyCode === 67 && e.ctrlKey) ||
      (e.keyCode === 86 && e.ctrlKey) ||
      (e.keyCode === 88 && e.ctrlKey) ||
      // Allow: home, end, left, right
      (e.keyCode >= 35 && e.keyCode <= 39)
    ) {
      return
    }
    // Block non-numeric
    if (
      (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
      (e.keyCode < 96 || e.keyCode > 105)
    ) {
      e.preventDefault()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData("text")
    let digits = pastedText.replace(/\D/g, "")

    // Handle +225 prefix in pasted content
    if (digits.startsWith("225") && digits.length > 10) {
      digits = digits.slice(3)
    }

    digits = digits.slice(0, 10)
    const formatted = formatForDisplay(digits)
    setDisplayValue(formatted)

    if (digits.length > 0) {
      onChange(`+225${digits}`)
    } else {
      onChange("")
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div className="flex">
        {/* Fixed +225 prefix */}
        <div className="flex items-center justify-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
          +225
        </div>
        {/* Input for digits */}
        <Input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="07 00 00 00 00"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            "rounded-l-none",
            error && "border-destructive focus-visible:ring-destructive"
          )}
          aria-invalid={!!error}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

export { PhoneInput }
