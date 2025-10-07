import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M10.5 8.5h3" />
      <path d="M10.5 15.5h3" />
      <path d="M10.5 12h.5" />
      <path d="M13.5 12h.5" />
      <path d="M4.5 12H10" />
      <path d="M14 12h5.5" />
      <path d="m14 15.5 5.5-3-5.5-3" />
      <path d="m10 8.5-5.5 3 5.5 3" />
    </svg>
  );
}