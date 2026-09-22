// src/components/ui/input.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-field border border-ink-300 bg-white px-3 py-2 text-base text-ink-900 " +
            "placeholder:text-ink-400 " +
            "transition-colors " +
            "file:border-0 file:bg-transparent file:text-sm file:font-medium " +
            "focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20 " +
            "disabled:cursor-not-allowed disabled:bg-ink-50 disabled:opacity-60 " +
            "aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus-visible:ring-red-500/20 " +
            "dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100 dark:placeholder:text-ink-500 " +
            "dark:disabled:bg-ink-950 " +
            className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };