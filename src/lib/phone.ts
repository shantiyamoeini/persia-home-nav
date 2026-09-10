const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toLatinDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (ch) => {
    const p = PERSIAN_DIGITS.indexOf(ch);
    if (p >= 0) return String(p);
    return String(ARABIC_DIGITS.indexOf(ch));
  });
}

export type PhoneResult = { ok: true; phone: string } | { ok: false; error: string };

/**
 * Normalizes any Iranian mobile input to the canonical 989xxxxxxxxx form.
 * Anything that is not an Iranian mobile number is rejected.
 */
export function normalizeIranPhone(raw: string): PhoneResult {
  const digits = toLatinDigits(String(raw ?? ""))
    .replace(/[\s\-()._]/g, "")
    .replace(/^\+/, "");

  if (!digits) return { ok: false, error: "شماره موبایل را وارد کنید." };
  if (/\D/.test(digits)) return { ok: false, error: "شماره موبایل باید فقط رقم باشد." };

  let body = digits;
  if (body.startsWith("0098")) body = body.slice(4);
  else if (body.startsWith("098")) body = body.slice(3);
  else if (body.startsWith("98")) body = body.slice(2);
  else if (body.startsWith("0")) body = body.slice(1);

  if (!/^9\d{9}$/.test(body)) {
    return { ok: false, error: "فقط شماره موبایل ایران پذیرفته می‌شود؛ مثل ۰۹۱۲۳۴۵۶۷۸۹." };
  }

  return { ok: true, phone: `98${body}` };
}

/** 989121234567 -> 0912 123 4567 (for display only) */
export function formatIranPhone(phone: string): string {
  if (!/^989\d{9}$/.test(phone)) return phone;
  const local = `0${phone.slice(2)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}
