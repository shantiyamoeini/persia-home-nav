import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeIranPhone } from "@/lib/phone";
import type { Client, Deal, PropertyType } from "@/lib/data";

const DEALS: Deal[] = ["sale", "rent"];
const TYPES: PropertyType[] = ["apartment", "villa", "land", "office", "shop"];

export type ClientInput = {
  name: string;
  phone: string;
  interest: Deal;
  type: PropertyType;
  budget: number;
  budgetMax: number;
  district: string;
  districts: string;
  minArea: number;
  maxArea: number;
  rooms: number;
  requirements: string;
  note: string;
};

const COLUMNS =
  "id, name, phone, interest, type, budget, budget_max, district, districts, min_area, max_area, rooms, requirements, note, created_at";

function positive(value: unknown, label: string): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) throw new Error(`${label} را درست وارد کنید.`);
  if (n < 0) throw new Error(`${label} نمی‌تواند منفی باشد.`);
  return Math.round(n);
}

/** Shared Persian validation for create and edit. */
export function validateClientInput(input: Partial<ClientInput>): ClientInput {
  const name = String(input.name ?? "").trim();
  if (name.length < 2) throw new Error("نام مشتری را کامل وارد کنید.");

  let phone = String(input.phone ?? "").trim();
  if (phone) {
    const parsed = normalizeIranPhone(phone);
    if (!parsed.ok) throw new Error(parsed.error);
    phone = parsed.phone;
  }

  const budget = positive(input.budget, "حداقل بودجه");
  const budgetMax = positive(input.budgetMax, "حداکثر بودجه");
  if (budgetMax > 0 && budgetMax < budget) {
    throw new Error("حداکثر بودجه نمی‌تواند کمتر از حداقل بودجه باشد.");
  }

  const minArea = positive(input.minArea, "حداقل متراژ");
  const maxArea = positive(input.maxArea, "حداکثر متراژ");
  if (maxArea > 0 && maxArea < minArea) {
    throw new Error("حداکثر متراژ نمی‌تواند کمتر از حداقل متراژ باشد.");
  }

  const districts = String(input.districts ?? "").trim().slice(0, 400);
  const district = String(input.district ?? "").trim() || districts.split(/[،,\n]/)[0]?.trim() || "";

  return {
    name,
    phone,
    interest: DEALS.includes(input.interest as Deal) ? (input.interest as Deal) : "sale",
    type: TYPES.includes(input.type as PropertyType) ? (input.type as PropertyType) : "apartment",
    budget,
    budgetMax,
    district: district.slice(0, 120),
    districts,
    minArea,
    maxArea,
    rooms: positive(input.rooms, "تعداد اتاق"),
    requirements: String(input.requirements ?? "").trim().slice(0, 2000),
    note: String(input.note ?? "").trim().slice(0, 2000),
  };
}

type Row = Record<string, unknown>;

function toClient(row: Row): Client {
  return {
    id: String(row["id"]),
    name: String(row["name"] ?? ""),
    phone: String(row["phone"] ?? ""),
    interest: (row["interest"] as Deal) ?? "sale",
    type: (row["type"] as PropertyType) ?? "apartment",
    budget: Number(row["budget"] ?? 0),
    budgetMax: Number(row["budget_max"] ?? 0),
    district: String(row["district"] ?? ""),
    districts: String(row["districts"] ?? ""),
    minArea: Number(row["min_area"] ?? 0),
    maxArea: Number(row["max_area"] ?? 0),
    rooms: Number(row["rooms"] ?? 0),
    requirements: String(row["requirements"] ?? ""),
    note: String(row["note"] ?? ""),
    createdAt: String(row["created_at"] ?? "").slice(0, 10),
  };
}

/** Resolves the agency owned by the caller; RLS keeps every query inside it. */
async function requireAgencyId(
  supabase: { from: (t: string) => any },
  userId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("agency_profiles")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (error) throw new Error("دسترسی به پروندهٔ آژانس ممکن نشد.");
  if (!data?.id) throw new Error("برای مدیریت مشتریان ابتدا حساب املاک بسازید.");
  return String(data.id);
}

function rowFor(d: ClientInput) {
  return {
    name: d.name,
    phone: d.phone,
    interest: d.interest,
    type: d.type,
    budget: d.budget,
    budget_max: d.budgetMax,
    district: d.district,
    districts: d.districts,
    min_area: d.minArea,
    max_area: d.maxArea,
    rooms: d.rooms,
    requirements: d.requirements,
    note: d.note,
  };
}

export const listAgencyClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Client[]> => {
    const agencyId = await requireAgencyId(context.supabase as never, context.userId);
    const { data, error } = await context.supabase
      .from("clients")
      .select(COLUMNS)
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false });
    if (error) throw new Error("بارگذاری فهرست مشتریان انجام نشد.");
    return (data ?? []).map((row) => toClient(row as Row));
  });

export const saveAgencyClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id?: string; draft: Partial<ClientInput> }) => ({
    id: input?.id ? String(input.id) : null,
    draft: validateClientInput(input?.draft ?? {}),
  }))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const { supabase, userId } = context;
    const agencyId = await requireAgencyId(supabase as never, userId);
    const row = rowFor(data.draft);

    if (data.id) {
      const { data: updated, error } = await supabase
        .from("clients")
        .update(row)
        .eq("id", data.id)
        .eq("agency_id", agencyId)
        .select("id")
        .maybeSingle();
      if (error || !updated) throw new Error("ذخیره تغییرات مشتری انجام نشد.");
      return { id: String(updated.id) };
    }

    const { data: created, error } = await supabase
      .from("clients")
      .insert({ ...row, agency_id: agencyId, user_id: userId })
      .select("id")
      .maybeSingle();
    if (error || !created) throw new Error("ثبت مشتری انجام نشد.");
    return { id: String(created.id) };
  });

export const deleteAgencyClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: String(input?.id ?? "") }))
  .handler(async ({ data, context }) => {
    const agencyId = await requireAgencyId(context.supabase as never, context.userId);
    await context.supabase
      .from("follow_ups")
      .update({ client_id: null })
      .eq("client_id", data.id)
      .eq("agency_id", agencyId);
    const { error } = await context.supabase
      .from("clients")
      .delete()
      .eq("id", data.id)
      .eq("agency_id", agencyId);
    if (error) throw new Error("حذف مشتری انجام نشد.");
    return { ok: true };
  });
