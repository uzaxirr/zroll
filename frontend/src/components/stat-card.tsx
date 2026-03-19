interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: "default" | "green" | "gold" | "red" | "amber";
}

const accentColors = {
  default: "text-primary",
  green: "text-green",
  gold: "text-gold",
  red: "text-error",
  amber: "text-warning",
};

export function StatCard({ label, value, sub, accent = "default" }: StatCardProps) {
  return (
    <div className="bg-white border border-card-border rounded-card p-6">
      <p className="text-sm text-secondary font-medium">{label}</p>
      <p className={`text-2xl font-headline font-bold tracking-tight mt-1.5 ${accentColors[accent]}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}
