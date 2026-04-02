---
name: new-component
description: Scaffold a new component with Shadcn/Radix patterns, cn() utility, and matching test file
disable-model-invocation: true
---

# New Component

Scaffold a new React component following project conventions.

## Arguments

The user should provide the component name and optionally the directory.

## Steps

1. Determine the component name and target directory:
   - UI primitives go in `components/ui/`
   - Feature components go in `components/<feature>/`
   - Layout components go in `components/layout/`

2. Create the component file at `components/<dir>/<name>.tsx`:
   ```tsx
   import { cn } from "@/lib/utils"

   interface <Name>Props {
     className?: string
   }

   export function <Name>({ className }: <Name>Props) {
     return (
       <div className={cn("", className)}>
         {/* TODO */}
       </div>
     )
   }
   ```

3. Create a matching test file at `tests/components/<dir>/<name>.test.tsx`:
   ```tsx
   import { render, screen } from "@testing-library/react"
   import { describe, it, expect } from "vitest"
   import { <Name> } from "@/components/<dir>/<name>"

   describe("<Name>", () => {
     it("renders without crashing", () => {
       render(<<Name> />)
     })
   })
   ```

4. Run `bun run test` to verify the test passes.

## Conventions

- Use `cn()` from `@/lib/utils` for conditional class merging
- Use named exports (not default exports)
- Props interface named `<ComponentName>Props`
- Use ternary (`condition ? <X /> : null`) over `&&` for nullable non-boolean values
- Static data arrays should be hoisted outside the component
- Use `{ passive: true }` on scroll/touch event listeners
