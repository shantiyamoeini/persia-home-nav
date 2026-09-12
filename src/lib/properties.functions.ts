import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normalizeIranPhone } from "@/lib/phone";
import type { Deal, Property, PropertyStatus, PropertyType } from "@/lib/data";

const DEALS: Deal[] = ["sale", "rent"];
const TYPES: PropertyType[] = ["apartment", "villa", "land", "office", "shop"];
const STATUSES: PropertyStatus[] = ["available", "reserved", "done"];

export type PropertyInput = {
  title: string;
  deal: Deal;
  type: PropertyType;
  area: number;
  rooms: number;
  floor: string;
  year: number;
  city: string;
  district: string;
  address: string;
  price?: number | undefined;
  deposit?: number | undefined;
  rent?: number | undefined;
  ownerName: string;
  ownerPhone: string;
  features: string[];
  photos: string[];
  note: string;
  status: PropertyStatus;
  isPublic: boolean;
};

const PUBLIC_COLUMNS =
  "id, title, deal, type, area, rooms, floor, build_year, city, district, address, price, deposit, rent, features, photos, status, is_public, archived, created_at";
const PRIVATE_RELATION = "property_private_details ( owner_name, owner_phone, internal_note )";

function positive(value: unknown, label: string): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) throw new Error(`${label} را درست وارد کنید.`);
  if (n < 0) throw new Error(`${label} نمی‌تواند منفی باشد.`);
  return Math.round(n);
}

function optionalAmount(value: unknown, label: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  return positive(value, label);
}

/** Shared validation so the same Persian errors apply on create and edit. */
export function validatePropertyInput(input: Partial<PropertyInput>): PropertyInput {
  const title = String(input.title ?? "").trim();
  if (title.length < 3) throw new Error("عنوان ملک را کامل وارد کنید.");

  const deal = DEALS.includes(input.deal as Deal) ? (input.deal as Deal) : "sale";
  const type = TYPES.includes(input.type as PropertyType) ? (input.type as PropertyType) : "apartment";
  const status = STATUSES.includes(input.status as PropertyStatus)
    ? (input.status as PropertyStatus)
    : "available";

  const area = positive(input.area, "متراژ");
  if (area <= 0) throw new Error("متراژ ملک را وارد کنید.");

  let ownerPhone = String(input.ownerPhone ?? "").trim();
  if (ownerPhone) {
    const parsed = normalizeIranPhone(ownerPhone);
    if (!parsed.ok) throw new Error(parsed.error);
    ownerPhone = parsed.phone;
  }

  return {
    title,
    deal,
    type,
    area,
    rooms: positive(input.rooms, "تعداد اتاق"),
    floor: String(input.floor ?? "").trim().slice(0, 40),
    year: positive(input.year, "سال ساخت") || 1400,
    city: String(input.city ?? "").trim() || "تهران",
    district: String(input.district ?? "").trim(),
    address: String(input.address ?? "").trim(),
    price: deal === "sale" ? (optionalAmount(input.price, "قیمت") ?? undefined) : undefined,
    deposit: deal === "rent" ? (optionalAmount(input.deposit, "ودیعه") ?? undefined) : undefined,
    rent: deal === "rent" ? (optionalAmount(input.rent, "اجاره") ?? undefined) : undefined,
    ownerName: String(input.ownerName ?? "").trim().slice(0, 120),
    ownerPhone,
    features: Array.isArray(input.features) ? input.features.map(String).slice(0, 40) : [],
    photos: Array.isArray(input.photos) ? input.photos.map(String).slice(0, 20) : [],
    note: String(input.note ?? "").trim().slice(0, 4000),
    status,
    isPublic: Boolean(input.isPublic),
  };
}

type Row = Record<string, unknown> & {
  property_private_details?:
    | { owner_name: string; owner_phone: string; internal_note: string }
    | { owner_name: string; owner_phone: string; internal_note: string }[]
    | null;
};

function toProperty(row: Row): Property {
  const rel = row.property_private_details;
  const priv = Array.isArray(rel) ? rel[0] : rel;
  return {
    id: String(row["id"]),
    title: String(row["title"] ?? ""),
    deal: (row["deal"] as Deal) ?? "sale",
    type: (row["type"] as PropertyType) ?? "apartment",
    area: Number(row["area"] ?? 0),
    rooms: Number(row["rooms"] ?? 0),
    floor: String(row["floor"] ?? ""),
    year: Number(row["build_year"] ?? 1400),
    city: String(row["city"] ?? ""),
    district: String(row["district"] ?? ""),
    address: String(row["address"] ?? ""),
    price: row["price"] == null ? undefined : Number(row["price"]),
    deposit: row["deposit"] == null ? undefined : Number(row["deposit"]),
    rent: row["rent"] == null ? undefined : Number(row["rent"]),
    ownerName: priv?.owner_name ?? "",
    ownerPhone: priv?.owner_phone ?? "",
    features: (row["features"] as string[]) ?? [],
    photos: (row["photos"] as string[]) ?? [],
    note: priv?.internal_note ?? "",
    status: (row["status"] as PropertyStatus) ?? "available",
    isPublic: Boolean(row["is_public"]),
    archived: Boolean(row["archived"]),
    createdAt: String(row["created_at"] ?? "").slice(0, 10),
  };
}

/** Resolves the agency owned by the caller. RLS keeps every query inside it. */
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
  if (!data?.id) throw new Error("برای مدیریت فایل‌ها ابتدا حساب املاک بسازید.");
  return String(data.id);
}

/** Agency-only listing: private CRM details come from the joined private table. */
export const listAgencyProperties = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Property[]> => {
    const agencyId = await requireAgencyId(context.supabase as never, context.userId);
    const { data, error } = await context.supabase
      .from("properties")
      .select(`${PUBLIC_COLUMNS}, ${PRIVATE_RELATION}`)
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false });
    if (error) throw new Error("بارگذاری فایل‌های ملک انجام نشد.");
    return (data ?? []).map((row) => toProperty(row as Row));
  });

export const getAgencyProperty = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: String(input?.id ?? "") }))
  .handler(async ({ data, context }): Promise<Property | null> => {
    const agencyId = await requireAgencyId(context.supabase as never, context.userId);
    const { data: row, error } = await context.supabase
      .from("properties")
      .select(`${PUBLIC_COLUMNS}, ${PRIVATE_RELATION}`)
      .eq("agency_id", agencyId)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error("بارگذاری فایل ملک انجام نشد.");
    return row ? toProperty(row as Row) : null;
  });

export const saveAgencyProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id?: string; draft: Partial<PropertyInput> }) => ({
    id: input?.id ? String(input.id) : null,
    draft: validatePropertyInput(input?.draft ?? {}),
  }))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const { supabase, userId } = context;
    const agencyId = await requireAgencyId(supabase as never, userId);
    const d = data.draft;

    const publicRow = {
      title: d.title,
      deal: d.deal,
      type: d.type,
      area: d.area,
      rooms: d.rooms,
      floor: d.floor,
      build_year: d.year,
      city: d.city,
      district: d.district,
      address: d.address,
      price: d.price ?? null,
      deposit: d.deposit ?? null,
      rent: d.rent ?? null,
      features: d.features,
      photos: d.photos,
      status: d.status,
      is_public: d.isPublic,
      published_at: d.isPublic ? new Date().toISOString() : null,
    };

    let propertyId = data.id;

    if (propertyId) {
      const { data: updated, error } = await supabase
        .from("properties")
        .update(publicRow)
        .eq("id", propertyId)
        .eq("agency_id", agencyId)
        .select("id")
        .maybeSingle();
      if (error || !updated) throw new Error("ذخیره تغییرات ملک انجام نشد.");
    } else {
      const { data: created, error } = await supabase
        .from("properties")
        .insert({ ...publicRow, agency_id: agencyId, user_id: userId })
        .select("id")
        .maybeSingle();
      if (error || !created) throw new Error("ثبت ملک انجام نشد.");
      propertyId = String(created.id);
    }

    const { error: privateError } = await supabase.from("property_private_details").upsert(
      {
        property_id: propertyId,
        agency_id: agencyId,
        owner_name: d.ownerName,
        owner_phone: d.ownerPhone,
        internal_note: d.note,
      },
      { onConflict: "property_id" },
    );
    if (privateError) throw new Error("ذخیره اطلاعات خصوصی مالک انجام نشد.");

    return { id: propertyId };
  });

export const setAgencyPropertyFlags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; isPublic?: boolean; archived?: boolean; status?: string }) => ({
    id: String(input?.id ?? ""),
    ...(typeof input?.isPublic === "boolean" ? { isPublic: input.isPublic } : {}),
    ...(typeof input?.archived === "boolean" ? { archived: input.archived } : {}),
    ...(STATUSES.includes(input?.status as PropertyStatus)
      ? { status: input.status as PropertyStatus }
      : {}),
  }))
  .handler(async ({ data, context }) => {
    const agencyId = await requireAgencyId(context.supabase as never, context.userId);
    const patch: {
      is_public?: boolean;
      published_at?: string | null;
      archived?: boolean;
      status?: string;
    } = {};
    if (typeof data.isPublic === "boolean") {
      patch.is_public = data.isPublic;
      patch.published_at = data.isPublic ? new Date().toISOString() : null;
    }
    if (typeof data.archived === "boolean") patch.archived = data.archived;
    if (data.status) patch.status = data.status;
    if (Object.keys(patch).length === 0) return { ok: true };

    const { data: updated, error } = await context.supabase
      .from("properties")
      .update(patch)
      .eq("id", data.id)
      .eq("agency_id", agencyId)
      .select("id")
      .maybeSingle();
    if (error || !updated) throw new Error("به‌روزرسانی وضعیت ملک انجام نشد.");
    return { ok: true };
  });

export const deleteAgencyProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: String(input?.id ?? "") }))
  .handler(async ({ data, context }) => {
    const agencyId = await requireAgencyId(context.supabase as never, context.userId);
    await context.supabase
      .from("property_private_details")
      .delete()
      .eq("property_id", data.id)
      .eq("agency_id", agencyId);
    await context.supabase
      .from("property_images")
      .delete()
      .eq("property_id", data.id)
      .eq("agency_id", agencyId);
    const { error } = await context.supabase
      .from("properties")
      .delete()
      .eq("id", data.id)
      .eq("agency_id", agencyId);
    if (error) throw new Error("حذف فایل ملک انجام نشد.");
    return { ok: true };
  });
