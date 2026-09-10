/**
 * SMS provider abstraction for one-time codes.
 * Server-only: never import this from client-reachable module scope.
 *
 * Two providers are wired: Bale and Safir. Neither is contacted unless its
 * real credentials exist in server secrets. Until then `resolveOtpProvider()`
 * returns the unconfigured provider, which sends nothing and reports a clear
 * Persian configuration message. No test/bypass code path exists.
 */

export type OtpSendResult =
  | { ok: true; provider: string }
  | { ok: false; provider: string; configured: boolean; message: string };

export interface OtpProvider {
  readonly name: string;
  readonly configured: boolean;
  send(phone: string, code: string): Promise<OtpSendResult>;
}

const NOT_CONFIGURED_MESSAGE =
  "سرویس پیامک هنوز تنظیم نشده است. تا زمان افزودن کلیدهای سرویس، با ایمیل و رمز عبور یا حساب گوگل وارد شوید.";

class UnconfiguredProvider implements OtpProvider {
  readonly name = "unconfigured";
  readonly configured = false;
  async send(): Promise<OtpSendResult> {
    return {
      ok: false,
      provider: this.name,
      configured: false,
      message: NOT_CONFIGURED_MESSAGE,
    };
  }
}

class BaleProvider implements OtpProvider {
  readonly name = "bale";
  readonly configured = true;
  constructor(
    private readonly apiKey: string,
    private readonly sender: string,
  ) {}

  async send(phone: string, code: string): Promise<OtpSendResult> {
    try {
      const res = await fetch("https://api.bale.ai/sms/v1/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: this.sender,
          recipient: `+${phone}`,
          message: `کد ورود شما به املاک‌یار: ${code}`,
        }),
      });
      if (!res.ok) {
        console.error(`[otp:bale] send failed with status ${res.status}`);
        return {
          ok: false,
          provider: this.name,
          configured: true,
          message: "ارسال پیامک انجام نشد. چند لحظه بعد دوباره تلاش کنید.",
        };
      }
      return { ok: true, provider: this.name };
    } catch (error) {
      console.error("[otp:bale] send threw", error);
      return {
        ok: false,
        provider: this.name,
        configured: true,
        message: "ارسال پیامک انجام نشد. چند لحظه بعد دوباره تلاش کنید.",
      };
    }
  }
}

class SafirProvider implements OtpProvider {
  readonly name = "safir";
  readonly configured = true;
  constructor(
    private readonly apiKey: string,
    private readonly sender: string,
  ) {}

  async send(phone: string, code: string): Promise<OtpSendResult> {
    try {
      const res = await fetch("https://api.safirsms.com/v1/messages", {
        method: "POST",
        headers: {
          "X-API-KEY": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.sender,
          to: `+${phone}`,
          text: `کد ورود شما به املاک‌یار: ${code}`,
        }),
      });
      if (!res.ok) {
        console.error(`[otp:safir] send failed with status ${res.status}`);
        return {
          ok: false,
          provider: this.name,
          configured: true,
          message: "ارسال پیامک انجام نشد. چند لحظه بعد دوباره تلاش کنید.",
        };
      }
      return { ok: true, provider: this.name };
    } catch (error) {
      console.error("[otp:safir] send threw", error);
      return {
        ok: false,
        provider: this.name,
        configured: true,
        message: "ارسال پیامک انجام نشد. چند لحظه بعد دوباره تلاش کنید.",
      };
    }
  }
}

export function resolveOtpProvider(): OtpProvider {
  const selected = (process.env["SMS_PROVIDER"] ?? "").trim().toLowerCase();

  const baleKey = process.env["BALE_API_KEY"];
  const baleSender = process.env["BALE_SENDER"];
  const safirKey = process.env["SAFIR_API_KEY"];
  const safirSender = process.env["SAFIR_SENDER"];

  if (selected === "bale" || (!selected && baleKey && baleSender)) {
    if (baleKey && baleSender) return new BaleProvider(baleKey, baleSender);
  }
  if (selected === "safir" || (!selected && safirKey && safirSender)) {
    if (safirKey && safirSender) return new SafirProvider(safirKey, safirSender);
  }
  return new UnconfiguredProvider();
}

export { NOT_CONFIGURED_MESSAGE };
