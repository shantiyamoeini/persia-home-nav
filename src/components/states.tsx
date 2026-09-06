import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingState({ text = "در حال بارگذاری..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-10 text-xs text-muted-foreground">
      <Loader2 className="size-5 animate-spin text-primary" />
      {text}
    </div>
  );
}

export function ErrorState({ text, onRetry }: { text?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <p className="text-xs font-bold text-destructive">
        {text || "خطا در دریافت اطلاعات. اتصال اینترنت را بررسی کنید."}
      </p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
        >
          تلاش مجدد
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <p className="text-xs text-muted-foreground">{text}</p>
      {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
    </div>
  );
}
