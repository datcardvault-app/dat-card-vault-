import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-app-secondary mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-11 px-3.5 rounded-lg bg-app-secondary border border-app text-app placeholder:text-app-muted transition-colors focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500",
            error && "border-error-500 focus:border-error-500 focus:ring-error-500",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-error-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
