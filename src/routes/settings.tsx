import { createFileRoute } from "@tanstack/react-router";
import { Database, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/app-shell";
import { LocalOnlyNote } from "@/components/local-note";
import { toFa } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "تنظیمات و داده‌ها | دستیار املاک" },
      {
        name: "description",
        content: "مدیریت داده‌های ذخیره‌شده روی این دستگاه: بازگردانی داده نمونه یا پاک کردن همه.",
      },
      { property: "og:title", content: "تنظیمات و داده‌ها" },
      { property: "og:description", content: "مدیریت داده‌های ذخیره‌شده روی این دستگاه." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { properties, clients, followUps, resetToDemo, clearAll } = useStore();

  return (
    <Screen>
      <TopBar title="تنظیمات" subtitle="داده‌های این دستگاه" />

      <div className="space-y-4 p-4">
        <LocalOnlyNote />

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Database className="size-4 text-primary" /> وضعیت ذخیره‌سازی
          </p>
          <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
            <li className="flex items-center justify-between border-b border-border pb-2">
              <span>فایل‌های ملک</span>
              <span className="font-bold text-foreground">{toFa(properties.length)}</span>
            </li>
            <li className="flex items-center justify-between border-b border-border pb-2">
              <span>مشتریان</span>
              <span className="font-bold text-foreground">{toFa(clients.length)}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>پیگیری‌ها</span>
              <span className="font-bold text-foreground">{toFa(followUps.length)}</span>
            </li>
          </ul>
        </div>

        <button
          onClick={() => {
            resetToDemo();
            toast.success("داده‌های نمونه بازگردانی شد");
          }}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-bold text-foreground shadow-sm"
        >
          <RotateCcw className="size-4 text-primary" /> بازگردانی داده‌های نمونه
        </button>

        <button
          onClick={() => {
            if (!window.confirm("همه اطلاعات این دستگاه پاک شود؟ این کار قابل بازگشت نیست.")) return;
            clearAll();
            toast.success("همه داده‌های این دستگاه پاک شد");
          }}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 text-sm font-bold text-destructive"
        >
          <Trash2 className="size-4" /> پاک کردن همه داده‌ها
        </button>
      </div>
    </Screen>
  );
}
