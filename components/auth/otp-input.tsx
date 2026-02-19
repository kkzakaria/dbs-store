"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

const LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, char: string) {
    // Gérer paste multi-caractères arrivant via onChange
    if (char.length > 1) {
      const digits = char.replace(/\D/g, "").slice(0, LENGTH);
      onChange(digits);
      const focusIndex = Math.min(digits.length, LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
      return;
    }
    const digit = char.replace(/\D/g, "").slice(-1);
    const chars = value.split("");
    chars[index] = digit;
    const next = chars.join("").padEnd(index + (digit ? 1 : 0), "").slice(0, LENGTH);
    onChange(next);
    if (digit && index < LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`Chiffre ${i + 1}`}
          className={cn(
            "size-11 rounded-lg border text-center text-lg font-semibold",
            "focus:outline-none focus:ring-2 focus:ring-primary",
            "transition-colors",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      ))}
    </div>
  );
}
