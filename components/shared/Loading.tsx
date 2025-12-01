import * as React from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface LoadingProps extends React.ComponentProps<"div"> {
  variant?: "spinner" | "dots" | "skeleton"
  size?: "sm" | "md" | "lg"
  text?: string
}

const sizeMap = {
  sm: { spinner: "size-4", dots: "size-1.5", text: "text-xs" },
  md: { spinner: "size-6", dots: "size-2", text: "text-sm" },
  lg: { spinner: "size-8", dots: "size-2.5", text: "text-base" },
}

function Loading({
  variant = "spinner",
  size = "md",
  text,
  className,
  ...props
}: LoadingProps) {
  const sizes = sizeMap[size]

  return (
    <div
      data-slot="loading"
      className={cn("flex items-center justify-center gap-2", className)}
      {...props}
    >
      {variant === "spinner" && <LoadingSpinner size={size} />}
      {variant === "dots" && <LoadingDots size={size} />}
      {variant === "skeleton" && (
        <Skeleton className={cn("h-4 w-24", sizes.spinner)} />
      )}
      {text && (
        <span className={cn("text-muted-foreground", sizes.text)}>{text}</span>
      )}
    </div>
  )
}

interface LoadingSpinnerProps extends React.ComponentProps<"svg"> {
  size?: "sm" | "md" | "lg"
}

function LoadingSpinner({ size = "md", className, ...props }: LoadingSpinnerProps) {
  const sizeClass = sizeMap[size].spinner

  return (
    <svg
      data-slot="loading-spinner"
      className={cn("animate-spin text-primary", sizeClass, className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

interface LoadingDotsProps extends React.ComponentProps<"div"> {
  size?: "sm" | "md" | "lg"
}

function LoadingDots({ size = "md", className, ...props }: LoadingDotsProps) {
  const dotSize = sizeMap[size].dots

  return (
    <div
      data-slot="loading-dots"
      className={cn("flex items-center gap-1", className)}
      {...props}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "rounded-full bg-primary animate-bounce",
            dotSize
          )}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

function ProductCardSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="product-card-skeleton"
      className={cn("space-y-3", className)}
      {...props}
    >
      {/* Image */}
      <Skeleton className="aspect-square w-full rounded-lg" />
      {/* Title */}
      <Skeleton className="h-4 w-3/4" />
      {/* Price */}
      <Skeleton className="h-4 w-1/2" />
      {/* Rating */}
      <Skeleton className="h-3 w-1/3" />
    </div>
  )
}

interface ProductGridSkeletonProps extends React.ComponentProps<"div"> {
  count?: number
}

function ProductGridSkeleton({
  count = 8,
  className,
  ...props
}: ProductGridSkeletonProps) {
  return (
    <div
      data-slot="product-grid-skeleton"
      className={cn(
        "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6",
        className
      )}
      {...props}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export {
  Loading,
  LoadingSpinner,
  LoadingDots,
  ProductCardSkeleton,
  ProductGridSkeleton,
}
