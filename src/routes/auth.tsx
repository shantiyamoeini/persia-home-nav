import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Mail, MessageSquare, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { TopBar } from "@/components/app-shell";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { claimAccountRole, requestPhoneOtp, verifyPhoneOtp } from "@/lib/auth.functions";
import { useAuth } from "@/lib/auth";
import { formatIranPhone, normalizeIranPhone, toLatinDigits } from "@/lib/phone";
import { cn } from "@/lib/utils";

type RoleParam = "user" | "agency";
type Method = "phone" | "email";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { role: RoleParam } => ({
    role: search["role"] === "agency" ? "agency" : "user",
  }),
  head: () => ({
    meta: [
      { title: "ورود و ثبت‌نام | املاک‌یار" },
      {
        name: "description",
        content: "ورود با شماره موبایل ایران، ایمیل و رمز عبور یا حساب گوگل در املاک‌یار.",
      },
      { property: "og:title", content: "ورود و ثبت‌نام املاک‌یار" },
      { property: "og:description", content: "ورود با موبایل، ایمیل یا گوگل." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { role } = Route.useSearch();
  const navigate = useNavigate();
  const { session, loading, exitGuest, refreshRole } = useAuth();

  const [method, setMethod] = useState<Method>("phone");
  const [busy, setBusy] = useState(false);

  const isAgency = role === "agency";

  const finishSignIn = useCallback(
    async (fullName: string, agencyName: string) => {
      exitGuest();
      try {
        await claimAccountRole({ data: { role, fullName, agencyName } });
      } catch (error) {
        console.error(error);
      }
      await refreshRole();
      await navigate({ to: "/", replace: true });
    },
    [exitGuest, navigate, refreshRole, role],
  );

  useEffect(() => {
    if (!loading && session) void finishSignIn("", "");
  }, [loading, session, finishSignIn]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <TopBar
        title={isAgency ? "ورود / ثبت‌نام املاک" : "ورود / ثبت‌نام کاربر"}
        subtitle={isAgency ? "پنل مدیریت دفتر املاک" : "جست‌وجو، علاقه‌مندی و گفت‌وگو"}
        back="/welcome"
      />

      <div className="flex-1 space-y-5 px-4 py-5">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
          {(
            [
              { key: "phone", label: "شماره موبایل", icon: MessageSquare },
              { key: "email", label: "ایمیل و رمز", icon: Mail },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMethod(key)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-colors",
                method === key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {method === "phone" ? (
          <PhoneForm role={role} onDone={finishSignIn} busy={busy} setBusy={setBusy} />
        ) : (
          <EmailForm role={role} onDone={finishSignIn} busy={busy} setBusy={setBusy} />
        )}

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[11px] text-muted-foreground">یا</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              window.sessionStorage.setItem("amlakyar.pendingRole", role);
              const result = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (result.error) {
                toast.error("ورود با گوگل انجام نشد. دوباره تلاش کنید.");
                return;
              }
              if (result.redirected) return;
              await finishSignIn("", "");
            } catch (error) {
              console.error(error);
              toast.error("ورود با گوگل انجام نشد.");
            } finally {
              setBusy(false);
            }
          }}
          className="w-full rounded-xl border border-border bg-card py-3 text-sm font-bold text-foreground transition-colors hover:bg-accent disabled:opacity-60"
        >
          ادامه با حساب گوگل
        </button>

        <p className="flex items-start gap-2 text-[11px] leading-5 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          نقش حساب (کاربر یا املاک) پس از ساخت حساب توسط سرور تعیین می‌شود و قابل تغییر از سمت
          برنامه نیست.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-input bg-card px-3 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
      />
    </label>
  );
}

function SubmitButton({
  busy,
  children,
}: {
  busy: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

function PhoneForm({
  role,
  onDone,
  busy,
  setBusy,
}: {
  role: RoleParam;
  onDone: (fullName: string, agencyName: string) => Promise<void>;
  busy: boolean;
  setBusy: (value: boolean) => void;
}) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"phone" | "code">("phone");
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [agencyName, setAgencyName] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  async function sendCode() {
    const parsed = normalizeIranPhone(phone);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const result = await requestPhoneOtp({ data: { phone: parsed.phone } });
      setCooldown(result.cooldownSeconds);
      if (result.sent) {
        setStage("code");
        toast.success(`کد ورود به ${formatIranPhone(parsed.phone)} پیامک شد.`);
      } else {
        setNotice(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ارسال کد انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    const parsed = normalizeIranPhone(phone);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }
    setBusy(true);
    try {
      const credentials = await verifyPhoneOtp({ data: { phone: parsed.phone, code } });
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      if (error) throw new Error("ورود انجام نشد. دوباره تلاش کنید.");
      await onDone(fullName, agencyName);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "کد تایید نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void (stage === "phone" ? sendCode() : verify());
      }}
    >
      <Field
        label="شماره موبایل"
        inputMode="tel"
        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
        dir="ltr"
        value={phone}
        onChange={(e) => setPhone(toLatinDigits(e.target.value))}
        disabled={stage === "code"}
      />

      {stage === "code" ? (
        <>
          <Field
            label="کد ۶ رقمی پیامک‌شده"
            inputMode="numeric"
            dir="ltr"
            maxLength={6}
            placeholder="------"
            value={code}
            onChange={(e) => setCode(toLatinDigits(e.target.value).replace(/\D/g, ""))}
          />
          <Field
            label="نام و نام خانوادگی"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="اختیاری"
          />
          {role === "agency" ? (
            <Field
              label="نام دفتر املاک"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="اختیاری"
            />
          ) : null}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <button
              type="button"
              disabled={cooldown > 0 || busy}
              onClick={() => void sendCode()}
              className="font-bold text-primary disabled:text-muted-foreground"
            >
              {cooldown > 0 ? `ارسال دوباره کد تا ${cooldown} ثانیه` : "ارسال دوباره کد"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStage("phone");
                setCode("");
              }}
              className="text-muted-foreground"
            >
              تغییر شماره
            </button>
          </div>
        </>
      ) : null}

      {notice ? (
        <p className="rounded-xl border border-border bg-secondary px-3 py-3 text-[12px] leading-6 text-foreground">
          {notice}
        </p>
      ) : null}

      <SubmitButton busy={busy}>{stage === "phone" ? "دریافت کد ورود" : "تایید و ورود"}</SubmitButton>
    </form>
  );
}

function EmailForm({
  role,
  onDone,
  busy,
  setBusy,
}: {
  role: RoleParam;
  onDone: (fullName: string, agencyName: string) => Promise<void>;
  busy: boolean;
  setBusy: (value: boolean) => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agencyName, setAgencyName] = useState("");

  async function submit() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("ایمیل معتبر وارد کنید.");
      return;
    }
    if (password.length < 8) {
      toast.error("رمز عبور باید حداقل ۸ کاراکتر باشد.");
      return;
    }
    if (mode === "signup" && !fullName.trim()) {
      toast.error("نام و نام خانوادگی را وارد کنید.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw new Error(persianAuthError(error.message));
        if (!data.session) {
          toast.success("برای فعال‌سازی حساب، ایمیل تاییدیه را باز کنید.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(persianAuthError(error.message));
      }
      await onDone(fullName, agencyName);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ورود انجام نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="flex gap-4 text-xs font-bold">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={mode === "signin" ? "text-primary" : "text-muted-foreground"}
        >
          ورود
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={mode === "signup" ? "text-primary" : "text-muted-foreground"}
        >
          ثبت‌نام
        </button>
      </div>

      <Field
        label="ایمیل"
        type="email"
        dir="ltr"
        value={email}
        onChange={(e) => setEmail(e.target.value.trim())}
      />
      <Field
        label="رمز عبور"
        type="password"
        dir="ltr"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {mode === "signup" ? (
        <>
          <Field
            label="نام و نام خانوادگی"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          {role === "agency" ? (
            <Field
              label="نام دفتر املاک"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
            />
          ) : null}
        </>
      ) : null}

      <SubmitButton busy={busy}>{mode === "signin" ? "ورود" : "ساخت حساب"}</SubmitButton>
    </form>
  );
}

function persianAuthError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("invalid login")) return "ایمیل یا رمز عبور درست نیست.";
  if (text.includes("already registered")) return "این ایمیل قبلاً ثبت شده است؛ وارد شوید.";
  if (text.includes("password")) return "رمز عبور معتبر نیست یا ضعیف است.";
  if (text.includes("rate limit")) return "درخواست‌ها زیاد است؛ چند دقیقه بعد تلاش کنید.";
  return "انجام نشد. دوباره تلاش کنید.";
}
