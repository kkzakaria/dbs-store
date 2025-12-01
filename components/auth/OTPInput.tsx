"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

function OTPInputField({
  length = 6,
  value,
  onChange,
  error,
  disabled = false,
  autoFocus = true,
  className,
}: OTPInputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-center">
        <InputOTP
          maxLength={length}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoFocus={autoFocus}
          pattern={REGEXP_ONLY_DIGITS}
          containerClassName="gap-2 sm:gap-3"
        >
          <InputOTPGroup>
            {Array.from({ length }).map((_, index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className={cn(
                  "h-12 w-10 sm:h-14 sm:w-12 text-lg font-semibold",
                  error && "border-destructive"
                )}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

export { OTPInputField as OTPInput }
