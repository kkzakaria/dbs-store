"use client"

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  type ProductFormStep,
  isFirstStep,
  isLastStep,
  PRODUCT_FORM_STEPS,
} from "./ProductFormStepper"

interface WizardNavigationProps {
  currentStep: ProductFormStep
  onPrevious: () => void
  onNext: () => void
  onSubmit?: () => void
  isValidating?: boolean
  isSubmitting?: boolean
  canGoNext?: boolean
  className?: string
}

export function WizardNavigation({
  currentStep,
  onPrevious,
  onNext,
  onSubmit,
  isValidating = false,
  isSubmitting = false,
  canGoNext = true,
  className,
}: WizardNavigationProps) {
  const isFirst = isFirstStep(currentStep)
  const isLast = isLastStep(currentStep)

  // Get current step info
  const currentStepInfo = PRODUCT_FORM_STEPS.find((s) => s.id === currentStep)
  const currentStepNumber = currentStepInfo?.number || 1

  return (
    <div className={className}>
      <div className="flex items-center justify-between">
        {/* Previous button */}
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={isFirst || isValidating || isSubmitting}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Précédent</span>
        </Button>

        {/* Step indicator (mobile) */}
        <div className="sm:hidden text-sm text-muted-foreground">
          Étape {currentStepNumber} / {PRODUCT_FORM_STEPS.length}
        </div>

        {/* Next/Submit button */}
        {isLast ? (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!canGoNext || isValidating || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Enregistrement...</span>
              </>
            ) : (
              <span>Enregistrer</span>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={!canGoNext || isValidating || isSubmitting}
            className="gap-2"
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Validation...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Suivant</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
