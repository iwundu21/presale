
"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import * as React from "react"

const Collapsible = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root> & {
    tag?: React.ElementType
  }
>(({ tag: Tag = "div", ...props }, ref) => (
  <CollapsiblePrimitive.Root ref={ref} asChild>
    <Tag {...props} />
  </CollapsiblePrimitive.Root>
))

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }

    