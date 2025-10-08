// src/components/ui/alert.tsx - REVISED: Switching from Absolute to Flex for better RTL/Content flow

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  // ✅ FIX: Use simple flexbox classes
  "relative w-full rounded-lg border p-4 flex items-start gap-4",
  {
    variants: {
      variant: {
        // ✅ FIX: Remove redundant positioning classes. Text/Icon colors are fine.
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success: "border-accent/50 text-accent dark:border-accent [&>svg]:text-accent"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

// ✅ IMPORTANT: Now, the icon MUST be wrapped in a div with the text in the component usage
/*
// Example of required usage:
<Alert>
    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
    <div> // <- This wrapper is now CRITICAL
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Description</AlertDescription>
    </div>
</Alert>
*/

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    // No changes needed here, its position is managed by the new flex parent
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    // No changes needed here
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }