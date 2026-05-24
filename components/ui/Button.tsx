import { cn } from "@/lib/utils";
import Link from "next/link";

type Variant = "primary" | "secondary";

type CommonProps = {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
};

const base =
  "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors";
const variants: Record<Variant, string> = {
  primary: "bg-neutral-900 text-white hover:bg-neutral-800",
  secondary:
    "bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50",
};

type ButtonProps = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  children,
  variant = "primary",
  className,
  ...rest
}: ButtonProps) {
  return (
    <button className={cn(base, variants[variant], className)} {...rest}>
      {children}
    </button>
  );
}

type LinkButtonProps = CommonProps & {
  href: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;

export function LinkButton({
  children,
  variant = "primary",
  className,
  href,
  ...rest
}: LinkButtonProps) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)} {...rest}>
      {children}
    </Link>
  );
}
