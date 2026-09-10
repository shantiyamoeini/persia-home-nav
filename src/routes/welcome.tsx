import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, Compass, UserRound } from "lucide-react";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "خوش آمدید | املاک‌یار" },
      {
        name: "description",
        content: "ورود یا ثبت‌نام کاربر و املاک، یا مشاهده آگهی‌ها بدون ورود در املاک‌یار.",
      },
      { property: "og:title", content: "خوش آمدید به املاک‌یار" },
      {
        property: "og:description",
        content: "ورود کاربر، ورود املاک یا ادامه بدون ورود.",
      },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  const { session, loading, continueAsGuest } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/", replace: true });
  }, [loading, session, navigate]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-between bg-background px-5 py-10">
      <div>
        <div className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <Building2 className="size-7" />
        </div>
        <h1 className="mt-6 text-2xl font-extrabold text-foreground">املاک‌یار</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          مدیریت املاک، مشتریان و پیگیری‌ها برای مشاوران املاک؛ همراه با جست‌وجوی آگهی‌ها برای
          خریداران و اجاره‌نشین‌ها.
        </p>
      </div>

      <div className="space-y-3">
        <Link
          to="/auth"
          search={{ role: "user" }}
          className="flex w-full items-center gap-3 rounded-2xl bg-primary px-4 py-4 text-right text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <UserRound className="size-5 shrink-0" />
          <span className="flex-1">ورود / ثبت‌نام کاربر</span>
        </Link>

        <Link
          to="/auth"
          search={{ role: "agency" }}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 text-right text-sm font-bold text-foreground transition-colors hover:bg-accent"
        >
          <Building2 className="size-5 shrink-0 text-primary" />
          <span className="flex-1">ورود / ثبت‌نام املاک</span>
        </Link>

        <button
          type="button"
          onClick={() => {
            continueAsGuest();
            void navigate({ to: "/", replace: true });
          }}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-right text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
        >
          <Compass className="size-5 shrink-0" />
          <span className="flex-1">ادامه بدون ورود</span>
        </button>

        <p className="pt-2 text-center text-[11px] leading-5 text-muted-foreground">
          در حالت مهمان، اطلاعات فقط روی همین دستگاه ذخیره می‌شود و همگام‌سازی نمی‌شود.
        </p>
      </div>
    </div>
  );
}
