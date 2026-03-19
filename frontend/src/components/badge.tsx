import { clsx } from "clsx";

type BadgeVariant = "green" | "amber" | "indigo" | "red" | "gray" | "blue";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  green: "bg-badge-green-bg text-green",
  amber: "bg-badge-amber-bg text-warning",
  indigo: "bg-badge-indigo-bg text-indigo-600",
  red: "bg-red-50 text-error",
  gray: "bg-gray-100 text-secondary",
  blue: "bg-blue-50 text-blue-600",
};

export function Badge({ children, variant = "green" }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-badge text-xs font-medium",
        variantStyles[variant]
      )}
    >
      {children}
    </span>
  );
}
