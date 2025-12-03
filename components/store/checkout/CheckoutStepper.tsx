"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export type CheckoutStep = "address" | "shipping" | "summary"

const STEPS: { id: CheckoutStep; label: string; number: number }[] = [
  { id: "address", label: "Adresse", number: 1 },
  { id: "shipping", label: "Livraison", number: 2 },
  { id: "summary", label: "Récapitulatif", number: 3 },
]

interface CheckoutStepperProps {
  currentStep: CheckoutStep
  completedSteps: Set<CheckoutStep>
  onStepClick?: (step: CheckoutStep) => void
}

export function CheckoutStepper({
  currentStep,
  completedSteps,
  onStepClick,
}: CheckoutStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep)

  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-center gap-2 sm:gap-4">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.has(step.id)
          const isCurrent = step.id === currentStep
          const isPending = !isCompleted && !isCurrent
          const isClickable = isCompleted && onStepClick

          return (
            <li key={step.id} className="flex items-center">
              {/* Step indicator */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary/10 text-primary ring-2 ring-primary",
                  isPending && "bg-muted text-muted-foreground",
                  isClickable && "cursor-pointer hover:bg-primary/80"
                )}
              >
                {/* Number or check icon */}
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                    isCompleted && "bg-primary-foreground/20",
                    isCurrent && "bg-primary text-primary-foreground",
                    isPending && "bg-muted-foreground/20"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    step.number
                  )}
                </span>
                {/* Label - hidden on mobile */}
                <span className="hidden sm:inline">{step.label}</span>
              </button>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 w-8 sm:w-12",
                    index < currentIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
