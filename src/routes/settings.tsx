import { createFileRoute } from "@tanstack/react-router";
import { Database, LogOut, RotateCcw, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/app-shell";
import { LocalOnlyNote } from "@/components/local-note";
import { toFa } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Link, useNavigate } from "@tanstack/react-router";

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
  const { user, role, isGuest, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <Screen>
      <TopBar title="تنظیمات" subtitle="داده‌های این دستگاه" />

      <section className="px-4 pt-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-secondary text-foreground">
              <UserRound className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">
                {user ? (user.email ?? "حساب من") : "مهمان"}
              </p>
              <p className="text-xs text-muted-foreground">
                {user
                  ? role === "agency"
                    ? "نقش حساب: دفتر املاک"
                    : role === "user"
                      ? "نقش حساب: کاربر"
                      : "در حال تعیین نقش حساب"
                  : "بدون ورود؛ فقط روی این دستگاه"}
              </p>
            </div>
          </div>

          {user ? (
            <button
              type="button"
              onClick={async () => {
                await signOut();
                await navigate({ to: "/welcome", replace: true });
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-xs font-bold text-destructive transition-colors hover:bg-accent"
            >
              <LogOut className="size-4" />
              خروج از حساب
            </button>
          ) : (
            <Link
              to="/welcome"
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground"
            >
              ورود یا ثبت‌نام
            </Link>
          )}
          {isGuest && !user ? (
            <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
              با ورود، امکان ذخیره علاقه‌مندی‌ها و گفت‌وگو فعال می‌شود.
            </p>
          ) : null}
        </div>
      </section>

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
