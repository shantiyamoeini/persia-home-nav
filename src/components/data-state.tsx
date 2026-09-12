import { CloudCheck, Smartphone } from "lucide-react";

/** Explains where the records the user is looking at are stored. */
export function StorageNote({ cloud }: { cloud: boolean }) {
  return (
    <p className="flex items-start gap-2 rounded-2xl border border-border bg-secondary/60 p-3 text-[11px] leading-5 text-muted-foreground">
      {cloud ? (
        <CloudCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
      ) : (
        <Smartphone className="mt-0.5 size-3.5 shrink-0 text-primary" />
      )}
      <span>
        {cloud
          ? "فایل‌ها در حساب دفتر شما ذخیره و همگام‌سازی می‌شود. نام و شماره مالک، آدرس دقیق و یادداشت‌ها فقط برای دفتر شما قابل مشاهده است."
          : "همه اطلاعات فقط روی همین دستگاه ذخیره می‌شود و هیچ‌جا همگام‌سازی نمی‌شود. با پاک کردن داده‌های مرورگر، اطلاعات از بین می‌رود."}
      </span>
    </p>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-4">
          <div className="h-20 w-full rounded-xl bg-secondary" />
          <div className="mt-3 h-3 w-2/3 rounded bg-secondary" />
          <div className="mt-2 h-3 w-1/3 rounded bg-secondary" />
        </div>
      ))}
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-center text-xs font-bold text-destructive">
      {message}
    </p>
  );
}
