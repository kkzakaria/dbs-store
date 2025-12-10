"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export type ProductFormStep =
  | "general"
  | "pricing"
  | "variants"
  | "images"
  | "seo"
  | "specs"

export const PRODUCT_FORM_STEPS: {
  id: ProductFormStep
  label: string
  shortLabel: string
  number: number
}[] = [
  { id: "general", label: "Informations", shortLabel: "Info", number: 1 },
  { id: "pricing", label: "Prix & Stock", shortLabel: "Prix", number: 2 },
  { id: "variants", label: "Variantes", shortLabel: "Var.", number: 3 },
  { id: "images", label: "Images", shortLabel: "Img", number: 4 },
  { id: "seo", label: "SEO", shortLabel: "SEO", number: 5 },
  { id: "specs", label: "Spécifications", shortLabel: "Specs", number: 6 },
]

interface ProductFormStepperProps {
  currentStep: ProductFormStep
  completedSteps: Set<ProductFormStep>
  onStepClick?: (step: ProductFormStep) => void
  className?: string
}

export function ProductFormStepper({
  currentStep,
  completedSteps,
  onStepClick,
  className,
}: ProductFormStepperProps) {
  const currentIndex = PRODUCT_FORM_STEPS.findIndex((s) => s.id === currentStep)

  return (
    <nav aria-label="Progress" className={className}>
      <ol className="flex items-center justify-between gap-1 sm:gap-2">
        {PRODUCT_FORM_STEPS.map((step, index) => {
          const isCompleted = completedSteps.has(step.id)
          const isCurrent = step.id === currentStep
          const isPending = !isCompleted && !isCurrent
          const isClickable = (isCompleted || index < currentIndex) && onStepClick

          return (
            <li key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step indicator */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-all",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary/10 text-primary ring-2 ring-primary",
                  isPending && "bg-muted text-muted-foreground",
                  isClickable && "cursor-pointer hover:opacity-80"
                )}
              >
                {/* Number or check icon */}
                <span
                  className={cn(
                    "flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[10px] sm:text-xs font-bold flex-shrink-0",
                    isCompleted && "bg-primary-foreground/20",
                    isCurrent && "bg-primary text-primary-foreground",
                    isPending && "bg-muted-foreground/20"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  ) : (
                    step.number
                  )}
                </span>
                {/* Label - show short on mobile, full on desktop */}
                <span className="hidden lg:inline">{step.label}</span>
                <span className="lg:hidden">{step.shortLabel}</span>
              </button>

              {/* Connector line */}
              {index < PRODUCT_FORM_STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-1 sm:mx-2 h-0.5 flex-1 min-w-[8px]",
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

// Helper function to get next step
export function getNextStep(current: ProductFormStep): ProductFormStep | null {
  const currentIndex = PRODUCT_FORM_STEPS.findIndex((s) => s.id === current)
  if (currentIndex < PRODUCT_FORM_STEPS.length - 1) {
    return PRODUCT_FORM_STEPS[currentIndex + 1].id
  }
  return null
}

// Helper function to get previous step
export function getPreviousStep(current: ProductFormStep): ProductFormStep | null {
  const currentIndex = PRODUCT_FORM_STEPS.findIndex((s) => s.id === current)
  if (currentIndex > 0) {
    return PRODUCT_FORM_STEPS[currentIndex - 1].id
  }
  return null
}

// Helper function to check if step is first
export function isFirstStep(step: ProductFormStep): boolean {
  return step === PRODUCT_FORM_STEPS[0].id
}

// Helper function to check if step is last
export function isLastStep(step: ProductFormStep): boolean {
  return step === PRODUCT_FORM_STEPS[PRODUCT_FORM_STEPS.length - 1].id
}
