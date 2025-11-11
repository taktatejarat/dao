// src/components/ui/file-input.tsx

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function FileInput({ label, id, className, ...props }: FileInputProps) {
  return (
    <div className={cn("grid w-full max-w-sm items-center gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="file" {...props} />
    </div>
  );
}