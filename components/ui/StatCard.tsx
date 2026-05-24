import { cn } from "@/lib/utils";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function StatCard({ children, className }: CardProps) {
  return <section className={cn("stat-card p-6 sm:p-8", className)}>{children}</section>;
}

type HeaderProps = {
  label: string;
  right?: React.ReactNode;
  className?: string;
};

export function StatCardHeader({ label, right, className }: HeaderProps) {
  return (
    <header className={cn("flex items-center justify-between mb-5", className)}>
      <span className="stat-label">{label}</span>
      {right ? <span className="stat-label text-neutral-500">{right}</span> : null}
    </header>
  );
}

export function StatDivider() {
  return <div className="border-t border-neutral-200/70 my-5" />;
}
