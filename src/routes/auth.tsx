import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Field, SegmentedControl, TextInput } from "@/components/form-kit";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "ورود به دستیار مشاور املاک" },
      {
        name: "description",
        content: "با ایمیل و رمز عبور وارد حساب خود شوید و به املاک، مشتریان و پیگیری‌ها برسید.",
      },
      { property: "og:title", content: "ورود به دستیار مشاور املاک" },
      { property: "og:description", content: "ورود و ساخت حساب مشاور املاک." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 6) {
      toast.error("ایمیل و رمز عبور (حداقل ۶ کاراکتر) را وارد کنید");
      return;
    }
    setPending(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("خوش آمدید");
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("حساب ساخته شد");
          navigate({ to: "/dashboard", replace: true });
        } else {
          setSent(true);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ورود انجام نشد");
    } finally {
      setPending(false);
    }
  };

  const google = async () => {
    setPending(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setPending(false);
      toast.error("ورود با گوگل انجام نشد");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  };

  if (sent) {
    return (
      <main className="mx-auto grid min-h-screen w-full max-w-md place-items-center px-6">
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="text-base font-extrabold text-foreground">ایمیل خود را بررسی کنید</h1>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            یک لینک تأیید به {email} فرستادیم. پس از کلیک روی لینک، وارد حساب می‌شوید.
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-4 text-xs font-bold text-primary"
          >
            بازگشت
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5 px-6 py-10">
      <div className="text-center">
        <h1 className="text-xl font-extrabold text-foreground">دستیار مشاور املاک</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          برای دیدن املاک، مشتریان و پیگیری‌های خودتان وارد شوید.
        </p>
      </div>

      <SegmentedControl<"login" | "signup">
        value={mode}
        onChange={setMode}
        options={[
          { value: "login", label: "ورود" },
          { value: "signup", label: "ساخت حساب" },
        ]}
      />

      <form onSubmit={submit} className="space-y-4">
        <Field label="ایمیل">
          <TextInput
            dir="ltr"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
        </Field>
        <Field label="رمز عبور" hint="حداقل ۶ کاراکتر">
          <TextInput
            dir="ltr"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full rounded-2xl bg-primary text-sm font-extrabold text-primary-foreground disabled:opacity-60"
        >
          {pending ? "لطفاً صبر کنید..." : mode === "login" ? "ورود" : "ساخت حساب"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> یا <span className="h-px flex-1 bg-border" />
      </div>

      <button
        onClick={google}
        disabled={pending}
        className="h-12 w-full rounded-2xl border border-border bg-card text-sm font-bold text-foreground disabled:opacity-60"
      >
        ورود با حساب گوگل
      </button>
    </main>
  );
}
