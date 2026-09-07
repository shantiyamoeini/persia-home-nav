import { Smartphone } from "lucide-react";

export function LocalOnlyNote({ compact = false }: { compact?: boolean }) {
  return (
    <p
      className={
        compact
          ? "flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground"
          : "flex items-start gap-2 rounded-2xl border border-border bg-secondary/60 p-3 text-[11px] leading-5 text-muted-foreground"
      }
    >
      <Smartphone className="mt-0.5 size-3.5 shrink-0 text-primary" />
      <span>
        همه اطلاعات فقط روی همین دستگاه ذخیره می‌شود و هیچ‌جا همگام‌سازی نمی‌شود. با پاک کردن
        داده‌های مرورگر، اطلاعات از بین می‌رود.
      </span>
    </p>
  );
}
