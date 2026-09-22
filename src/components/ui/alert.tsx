// src/components/ui/alert.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative flex items-start gap-3 rounded-field border p-3 text-sm",
  {
    variants: {
      variant: {
        error:
          "border-red-200 bg-red-50 text-red-800 " +
          "dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-800 " +
          "dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200",
        warning:
          "border-amber-200 bg-amber-50 text-amber-800 " +
          "dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200",
        info:
          "border-ink-200 bg-ink-50 text-ink-800 " +
          "dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200",
      },
    },
    defaultVariants: { variant: "info" },
  }
);

const ICONS = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: AlertCircle,
  info: Info,
} as const;

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "info", title, children, ...props }, ref) => {
    const Icon = ICONS[variant ?? "info"];
    const role = variant === "error" ? "alert" : "status";
    const ariaLive = variant === "error" ? "assertive" : "polite";

    return (
      <div
        ref={ref}
        role={role}
        aria-live={ariaLive}
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <div className="flex-1">
          {title && <p className="font-medium">{title}</p>}
          {children && <div className={cn(title && "mt-1")}>{children}</div>}
        </div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

export { Alert };