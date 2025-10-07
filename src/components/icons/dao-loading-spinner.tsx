import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export function DaoLoadingSpinner(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      className={cn("animate-spin", props.className)}
    >
      <defs>
        <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "hsl(var(--chart-2))", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "hsl(var(--chart-3))", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="url(#spinner-gradient)" />
    </svg>
  );
}
