export type Deal = "sale" | "rent";

export type PropertyType = "apartment" | "villa" | "land" | "office" | "shop";

export const propertyTypeLabels: Record<PropertyType, string> = {
  apartment: "آپارتمان",
  villa: "ویلا",
  land: "زمین",
  office: "دفتر کار",
  shop: "مغازه",
};

export const dealLabels: Record<Deal, string> = {
  sale: "فروش",
  rent: "اجاره",
};

export type Channel = "call" | "visit" | "message";

export const channelLabels: Record<Channel, string> = {
  call: "تماس تلفنی",
  visit: "بازدید ملک",
  message: "پیام",
};

export type Property = {
  id: string;
  title: string;
  deal: Deal;
  type: PropertyType;
  area: number;
  rooms: number;
  floor: string;
  build_year: number;
  city: string;
  district: string;
  address: string;
  price: number | null;
  deposit: number | null;
  rent: number | null;
  owner_name: string;
  owner_phone: string;
  features: string[];
  note: string;
  photos: string[];
  created_at: string;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  interest: Deal;
  type: PropertyType;
  budget: number;
  district: string;
  min_area: number;
  rooms: number;
  note: string;
  created_at: string;
};

export type FollowUp = {
  id: string;
  client_id: string | null;
  client_name: string;
  subject: string;
  due_date: string;
  due_time: string;
  channel: Channel;
  done: boolean;
  created_at: string;
};

export const featureOptions = [
  "پارکینگ",
  "انباری",
  "آسانسور",
  "بالکن",
  "کولر گازی",
  "بازسازی شده",
  "سند تک‌برگ",
];

export const districts = [
  "سعادت‌آباد",
  "زعفرانیه",
  "پونک",
  "نارمک",
  "ولنجک",
  "اکباتان",
  "جردن",
  "سایر",
];

const faDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFa(value: string | number) {
  return String(value).replace(/\d/g, (d) => faDigits[Number(d)] ?? d);
}

export function formatPrice(value?: number | null) {
  if (!value) return "توافقی";
  if (value >= 1_000_000_000) {
    const b = value / 1_000_000_000;
    return `${toFa(Number(b.toFixed(1)).toLocaleString("en-US"))} میلیارد تومان`;
  }
  return `${toFa(Math.round(value / 1_000_000).toLocaleString("en-US"))} میلیون تومان`;
}

export function priceLine(p: Property) {
  if (p.deal === "sale") return formatPrice(p.price);
  return `ودیعه ${formatPrice(p.deposit)} · اجاره ${formatPrice(p.rent)}`;
}

export const todayIso = new Date().toISOString().slice(0, 10);

export function formatDate(isoDate: string) {
  const d = new Date(isoDate + "T00:00:00");
  return toFa(
    d.toLocaleDateString("fa-IR-u-nu-latn", { day: "numeric", month: "long" }),
  );
}
