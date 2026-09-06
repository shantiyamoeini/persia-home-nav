import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, CalendarCheck, Users } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "دستیار مشاور املاک | مدیریت ملک، مشتری و پیگیری" },
      {
        name: "description",
        content:
          "اپ فارسی مشاوران املاک: ثبت املاک با عکس، پرونده مشتریان و پیگیری‌های روزانه در گوشی.",
      },
      { property: "og:title", content: "دستیار مشاور املاک" },
      {
        property: "og:description",
        content: "ثبت املاک با عکس، پرونده مشتریان و پیگیری‌های روزانه.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-6 py-12">
      <div>
        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
          نسخه موبایل مشاوران املاک
        </span>
        <h1 className="mt-4 text-2xl font-extrabold leading-9 text-foreground">
          دستیار مشاور املاک
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          فایل‌های ملک با عکس، پرونده کامل مشتریان و پیگیری‌های روزانه — همه در یک اپ ساده و
          خصوصی. اطلاعات هر مشاور فقط برای خودش قابل دیدن است.
        </p>
      </div>

      <ul className="space-y-3">
        {[
          { icon: Building2, text: "ثبت و ویرایش فایل ملک همراه چند عکس و ترتیب دلخواه" },
          { icon: Users, text: "پرونده مشتری با تاریخچه کامل پیگیری‌ها" },
          { icon: CalendarCheck, text: "پیگیری‌های امروز، آینده و انجام‌شده" },
        ].map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-xs text-foreground"
          >
            <Icon className="size-5 shrink-0 text-primary" />
            {text}
          </li>
        ))}
      </ul>

      <Link
        to="/auth"
        className="grid h-12 place-items-center rounded-2xl bg-primary text-sm font-extrabold text-primary-foreground"
      >
        ورود یا ساخت حساب
      </Link>
    </main>
  );
}
