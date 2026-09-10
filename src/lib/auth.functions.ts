import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeIranPhone } from "@/lib/phone";

const OTP_TTL_SECONDS = 180; // 3 minutes
const RESEND_COOLDOWN_SECONDS = 90;
const MAX_REQUESTS_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const PHONE_EMAIL_DOMAIN = "phone.amlakyar.app";

type RequestOtpResult = {
  sent: boolean;
  configured: boolean;
  message: string;
  cooldownSeconds: number;
  expiresInSeconds: number;
};

type VerifyOtpResult = {
  email: string;
  password: string;
};

function pepper(): string {
  const value = process.env["OTP_PEPPER"] ?? process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!value) throw new Error("سرویس ورود در دسترس نیست.");
  return value;
}

async function hashCode(phone: string, code: string): Promise<string> {
  const data = new TextEncoder().encode(`${phone}:${code}:${pepper()}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(100000 + ((buf[0] ?? 0) % 900000));
}

function randomPassword(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return `Ap1!${Array.from(bytes)
    .map((b) => b.toString(36))
    .join("")
    .slice(0, 32)}`;
}

/** Public: issues a hashed one-time code. The code itself is never returned. */
export const requestPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { phone: string }) => {
    const parsed = normalizeIranPhone(input?.phone ?? "");
    if (!parsed.ok) throw new Error(parsed.error);
    return { phone: parsed.phone };
  })
  .handler(async ({ data }): Promise<RequestOtpResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { resolveOtpProvider } = await import("@/lib/sms/provider.server");

    const now = Date.now();
    const { data: recent, error: recentError } = await supabaseAdmin
      .from("otp_requests")
      .select("created_at")
      .eq("phone", data.phone)
      .gte("created_at", new Date(now - 3600_000).toISOString())
      .order("created_at", { ascending: false });
    if (recentError) throw new Error("سرویس ورود در دسترس نیست. بعداً تلاش کنید.");

    if ((recent?.length ?? 0) >= MAX_REQUESTS_PER_HOUR) {
      throw new Error("تعداد درخواست کد بیش از حد مجاز است. یک ساعت بعد تلاش کنید.");
    }
    const last = recent?.[0]?.created_at;
    if (last) {
      const elapsed = Math.floor((now - new Date(last).getTime()) / 1000);
      if (elapsed < RESEND_COOLDOWN_SECONDS) {
        throw new Error(
          `برای درخواست کد تازه ${RESEND_COOLDOWN_SECONDS - elapsed} ثانیه صبر کنید.`,
        );
      }
    }

    const provider = resolveOtpProvider();
    const code = randomCode();
    const codeHash = await hashCode(data.phone, code);

    const { error: insertError } = await supabaseAdmin.from("otp_requests").insert({
      phone: data.phone,
      code_hash: codeHash,
      expires_at: new Date(now + OTP_TTL_SECONDS * 1000).toISOString(),
      provider: provider.name,
    });
    if (insertError) throw new Error("سرویس ورود در دسترس نیست. بعداً تلاش کنید.");

    const result = await provider.send(data.phone, code);
    if (!result.ok) {
      return {
        sent: false,
        configured: result.configured,
        message: result.message,
        cooldownSeconds: RESEND_COOLDOWN_SECONDS,
        expiresInSeconds: OTP_TTL_SECONDS,
      };
    }

    return {
      sent: true,
      configured: true,
      message: "کد ورود پیامک شد.",
      cooldownSeconds: RESEND_COOLDOWN_SECONDS,
      expiresInSeconds: OTP_TTL_SECONDS,
    };
  });

/**
 * Public: verifies a one-time code and returns single-use credentials the
 * browser immediately exchanges for a Supabase session. The credential is
 * rotated on every successful verification.
 */
export const verifyPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { phone: string; code: string }) => {
    const parsed = normalizeIranPhone(input?.phone ?? "");
    if (!parsed.ok) throw new Error(parsed.error);
    const code = String(input?.code ?? "").replace(/\D/g, "");
    if (code.length !== 6) throw new Error("کد ۶ رقمی را کامل وارد کنید.");
    return { phone: parsed.phone, code };
  })
  .handler(async ({ data }): Promise<VerifyOtpResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("otp_requests")
      .select("id, code_hash, attempts, expires_at")
      .eq("phone", data.phone)
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error("سرویس ورود در دسترس نیست. بعداً تلاش کنید.");
    if (!row) throw new Error("کد منقضی شده است. کد تازه بگیرید.");
    if (row.attempts >= MAX_VERIFY_ATTEMPTS) {
      throw new Error("تعداد تلاش‌های اشتباه زیاد بود. کد تازه بگیرید.");
    }

    const expected = await hashCode(data.phone, data.code);
    if (expected !== row.code_hash) {
      await supabaseAdmin
        .from("otp_requests")
        .update({ attempts: row.attempts + 1 })
        .eq("id", row.id);
      const left = MAX_VERIFY_ATTEMPTS - (row.attempts + 1);
      throw new Error(
        left > 0 ? `کد وارد‌شده درست نیست. ${left} تلاش دیگر دارید.` : "کد اشتباه بود. کد تازه بگیرید.",
      );
    }

    const { data: consumed } = await supabaseAdmin
      .from("otp_requests")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", row.id)
      .is("consumed_at", null)
      .select("id");
    if (!consumed || consumed.length === 0) {
      throw new Error("این کد قبلاً استفاده شده است. کد تازه بگیرید.");
    }

    const email = `${data.phone}@${PHONE_EMAIL_DOMAIN}`;
    const password = randomPassword();

    const { data: profileRow } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("phone", data.phone)
      .maybeSingle();

    let userId = profileRow?.id ?? null;

    if (!userId) {
      const created = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        phone_confirm: false,
        user_metadata: { phone: data.phone },
      });
      if (created.data.user) {
        userId = created.data.user.id;
      } else {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        userId = list?.users.find((u) => u.email === email)?.id ?? null;
      }
    }

    if (!userId) throw new Error("ساخت حساب انجام نشد. بعداً تلاش کنید.");

    const updated = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    if (updated.error) throw new Error("ورود انجام نشد. بعداً تلاش کنید.");

    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, phone: data.phone }, { onConflict: "id" });

    return { email, password };
  });

/**
 * Assigns the account role once. The role is server-controlled: clients have no
 * write access to `user_roles`, and an existing role is never overwritten.
 */
export const claimAccountRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { role?: string; fullName?: string; agencyName?: string }) => {
    const role = input?.role === "agency" ? "agency" : "user";
    return {
      role: role as "user" | "agency",
      fullName: String(input?.fullName ?? "").trim().slice(0, 120),
      agencyName: String(input?.agencyName ?? "").trim().slice(0, 120),
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;

    const { data: existing } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const role = (existing?.role as "user" | "agency" | undefined) ?? data.role;

    if (!existing) {
      const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
      if (error) throw new Error("تعیین نقش حساب انجام نشد.");
    }

    const phone = typeof claims["phone"] === "string" ? (claims["phone"] as string) : null;
    await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        ...(data.fullName ? { full_name: data.fullName } : {}),
        ...(phone ? { phone } : {}),
      },
      { onConflict: "id" },
    );

    let agencyId: string | null = null;
    if (role === "agency") {
      const { data: agency } = await supabaseAdmin
        .from("agency_profiles")
        .select("id")
        .eq("owner_id", userId)
        .maybeSingle();
      if (agency) {
        agencyId = agency.id;
      } else {
        const name = data.agencyName || data.fullName || "املاک من";
        const slug = `ag-${userId.slice(0, 8)}-${Date.now().toString(36)}`;
        const { data: created } = await supabaseAdmin
          .from("agency_profiles")
          .insert({ owner_id: userId, name, slug })
          .select("id")
          .maybeSingle();
        agencyId = created?.id ?? null;
      }
    }

    return { role, agencyId };
  });
