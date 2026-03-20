import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-white border border-card-border rounded-card p-12 text-center">
      <div className="w-12 h-12 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-green" />
      </div>
      <h3 className="text-base font-medium text-primary">{title}</h3>
      <p className="text-sm text-secondary mt-1.5 max-w-sm mx-auto">{description}</p>
      {action && (
        <div className="mt-5">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center text-sm font-medium bg-green text-white px-5 py-2.5 rounded-btn hover:bg-green/90 transition-colors"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center text-sm font-medium bg-green text-white px-5 py-2.5 rounded-btn hover:bg-green/90 transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
