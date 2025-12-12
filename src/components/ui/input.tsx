// src/components/ui/input.tsx

import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, ...props }, ref) => {
    
    // ✅ FIX: جلوگیری از خطای "controlled to uncontrolled"
    // اگر مقدار value تعریف نشده (undefined) باشد، آن را به رشته خالی تبدیل می‌کنیم.
    // نکته: اینپوت‌های نوع file همیشه باید uncontrolled باشند، پس آنها را تغییر نمی‌دهیم.
    const safeValue = (type !== 'file' && value === undefined) ? '' : value;

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "text-start", // اجباری برای پشتیبانی صحیح RTL/LTR
          className
        )}
        ref={ref}
        value={safeValue}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }