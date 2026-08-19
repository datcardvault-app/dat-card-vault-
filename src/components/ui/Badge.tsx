import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "error" | "accent";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-app-tertiary text-app-secondary",
  primary: "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300",
  success: "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300",
  warning: "bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300",
  error: "bg-error-100 text-error-700 dark:bg-error-900/40 dark:text-error-300",
  accent: "bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
