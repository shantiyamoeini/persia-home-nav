import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2, CalendarCheck, LayoutGrid, Settings, Users } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-24">
      {children}
    </div>
  );
}

export function TopBar({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  action?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-4 py-4 backdrop-blur">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {back ? (
            <Link
              to={back}
              aria-label="بازگشت"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-accent"
            >
              <ArrowRight className="size-4" />
            </Link>
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-foreground">{title}</h1>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
    </header>
  );
}

const navItems = [
  { to: "/", label: "خانه", icon: LayoutGrid },
  { to: "/properties", label: "املاک", icon: Building2 },
  { to: "/clients", label: "مشتریان", icon: Users },
  { to: "/followups", label: "پیگیری", icon: CalendarCheck },
  { to: "/settings", label: "تنظیمات", icon: Settings },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {navItems.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex flex-col items-center gap-1 py-3 text-[11px] text-muted-foreground transition-colors data-[status=active]:text-primary"
              activeProps={{ className: "font-bold" }}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SectionTitle({
  title,
  actionLabel,
  to,
}: {
  title: string;
  actionLabel?: string;
  to?: "/properties" | "/clients" | "/followups" | "/settings";
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
      {to && actionLabel ? (
        <Link to={to} className="text-xs font-medium text-primary">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function Chip({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "primary" | "accent";
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-medium",
        tone === "muted" && "bg-secondary text-secondary-foreground",
        tone === "primary" && "bg-primary/10 text-primary",
        tone === "accent" && "bg-accent text-accent-foreground",
      )}
    >
      {children}
    </span>
  );
}
