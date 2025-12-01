"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

function OTPInput({
  length = 6,
  value,
  onChange,
  error,
  disabled = false,
  autoFocus = true,
  className,
}: OTPInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])
  const [activeIndex, setActiveIndex] = React.useState(0)

  // Focus first input on mount
  React.useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  // Focus appropriate input when value changes externally
  React.useEffect(() => {
    const nextEmptyIndex = value.length
    if (nextEmptyIndex < length && inputRefs.current[nextEmptyIndex]) {
      inputRefs.current[nextEmptyIndex]?.focus()
    }
  }, [value, length])

  const handleChange = (index: number, inputValue: string) => {
    // Only accept single digit
    const digit = inputValue.replace(/\D/g, "").slice(-1)

    if (!digit && inputValue !== "") return

    // Build new value
    const newValue = value.split("")
    newValue[index] = digit
    const joined = newValue.join("").slice(0, length)
    onChange(joined)

    // Move to next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault()

      if (value[index]) {
        // Clear current
        const newValue = value.split("")
        newValue[index] = ""
        onChange(newValue.join(""))
      } else if (index > 0) {
        // Move to previous and clear
        inputRefs.current[index - 1]?.focus()
        const newValue = value.split("")
        newValue[index - 1] = ""
        onChange(newValue.join(""))
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    } else if (e.key === "Delete") {
      e.preventDefault()
      const newValue = value.split("")
      newValue[index] = ""
      onChange(newValue.join(""))
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData("text")
    const digits = pastedText.replace(/\D/g, "").slice(0, length)

    if (digits) {
      onChange(digits)
      // Focus last filled or next empty
      const focusIndex = Math.min(digits.length, length - 1)
      inputRefs.current[focusIndex]?.focus()
    }
  }

  const handleFocus = (index: number) => {
    setActiveIndex(index)
    // Select the content on focus
    inputRefs.current[index]?.select()
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-center gap-2 sm:gap-3">
        {Array.from({ length }).map((_, index) => (
          <Input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={value[index] || ""}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(index)}
            disabled={disabled}
            className={cn(
              "h-12 w-10 sm:h-14 sm:w-12 text-center text-lg font-semibold",
              "focus:ring-2 focus:ring-primary",
              error && "border-destructive focus:ring-destructive",
              activeIndex === index && "ring-2 ring-primary"
            )}
            aria-label={`Digit ${index + 1}`}
            aria-invalid={!!error}
          />
        ))}
      </div>
      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

export { OTPInput }
