import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-app-tertiary flex items-center justify-center mb-4 text-app-muted">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-lg text-app mb-1">{title}</h3>
      {description && <p className="text-sm text-app-muted max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}
