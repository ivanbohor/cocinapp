// src/components/ui/button.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base común a todos los variants
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-field font-medium " +
    "transition-colors duration-150 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 " +
    "disabled:pointer-events-none disabled:opacity-60 " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary = marca
        default:
          "bg-brand-500 text-white shadow-brand hover:bg-brand-600 active:bg-brand-700 " +
          "dark:bg-brand-500 dark:hover:bg-brand-400 dark:active:bg-brand-600",
        // Secundario = tinta oscura (para acciones fuertes pero no de marca)
        secondary:
          "bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950 " +
          "dark:bg-ink-100 dark:text-ink-900 dark:hover:bg-white",
        // Outline
        outline:
          "border border-ink-300 bg-white text-ink-900 hover:bg-ink-50 " +
          "dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100 dark:hover:bg-ink-800",
        // Ghost
        ghost:
          "text-ink-700 hover:bg-ink-100 hover:text-ink-900 " +
          "dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ink-100",
        // Destructivo
        destructive:
          "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 " +
          "focus-visible:ring-red-500/40",
        // Link
        link:
          "text-brand-600 underline-offset-4 hover:underline " +
          "dark:text-brand-400",
      },
      size: {
        sm: "h-9 px-3 text-sm [&_svg]:size-4",
        default: "h-11 px-4 text-base [&_svg]:size-4",
        lg: "h-12 px-6 text-base [&_svg]:size-5",
        icon: "h-11 w-11 [&_svg]:size-5",
        // Nuevo: icon chico para acciones en tablas
        "icon-sm": "h-8 w-8 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };