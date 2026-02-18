"use client"

import { VisuallyHidden as VisuallyHiddenPrimitive } from "@radix-ui/react-visually-hidden"

function VisuallyHidden({
  ...props
}: React.ComponentProps<typeof VisuallyHiddenPrimitive>) {
  return <VisuallyHiddenPrimitive data-slot="visually-hidden" {...props} />
}

export { VisuallyHidden }
