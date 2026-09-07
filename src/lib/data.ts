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

export type Property = {
  id: string;
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
  createdAt: string;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  interest: Deal;
  type: PropertyType;
  budget: number;
  district: string;
  minArea: number;
  rooms: number;
  note: string;
  createdAt: string;
};

export type FollowUp = {
  id: string;
  clientId?: string | undefined;
  clientName: string;
  subject: string;
  date: string; // ISO date
  time: string;
  channel: "call" | "visit" | "message";
  done: boolean;
};

export const channelLabels: Record<FollowUp["channel"], string> = {
  call: "تماس تلفنی",
  visit: "بازدید ملک",
  message: "پیام",
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
];

const fa = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFa(value: string | number) {
  return String(value).replace(/\d/g, (d) => fa[Number(d)] ?? d);
}

export function formatPrice(value?: number) {
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

const today = new Date();
const iso = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export const todayIso = iso(0);

export function formatDate(isoDate: string) {
  const d = new Date(isoDate + "T00:00:00");
  return toFa(
    d.toLocaleDateString("fa-IR-u-nu-latn", { day: "numeric", month: "long" }),
  );
}

export const initialProperties: Property[] = [
  {
    id: "p1",
    title: "آپارتمان ۱۲۰ متری سعادت‌آباد",
    deal: "sale",
    type: "apartment",
    area: 120,
    rooms: 2,
    floor: "۳ از ۶",
    year: 1398,
    city: "تهران",
    district: "سعادت‌آباد",
    address: "خیابان علامه جنوبی، کوچه ۱۴",
    price: 9_500_000_000,
    ownerName: "آقای رستمی",
    ownerPhone: "۰۹۱۲۳۴۵۶۷۸۹",
    features: ["پارکینگ", "انباری", "آسانسور", "بالکن"],
    photos: [],
    note: "کلید تحویل، آماده بازدید در ساعات اداری.",
    createdAt: iso(-1),
  },
  {
    id: "p2",
    title: "ویلا دوبلکس ولنجک",
    deal: "sale",
    type: "villa",
    area: 320,
    rooms: 4,
    floor: "دو طبقه",
    year: 1401,
    city: "تهران",
    district: "ولنجک",
    address: "بلوار دانشجو، کوچه هشتم",
    price: 48_000_000_000,
    ownerName: "خانم کریمی",
    ownerPhone: "۰۹۱۲۷۷۷۱۲۳۴",
    features: ["پارکینگ", "سند تک‌برگ", "بازسازی شده"],
    photos: [],
    note: "مالک برای معاوضه هم آمادگی دارد.",
    createdAt: iso(-2),
  },
  {
    id: "p3",
    title: "آپارتمان ۷۵ متری پونک",
    deal: "rent",
    type: "apartment",
    area: 75,
    rooms: 2,
    floor: "۵ از ۸",
    year: 1395,
    city: "تهران",
    district: "پونک",
    address: "خیابان سیمون بولیوار، مجتمع نگین",
    deposit: 500_000_000,
    rent: 32_000_000,
    ownerName: "آقای صدیقی",
    ownerPhone: "۰۹۳۵۱۱۲۲۳۳۴",
    features: ["آسانسور", "کولر گازی", "پارکینگ"],
    photos: [],
    note: "تحویل از اول ماه آینده.",
    createdAt: iso(-3),
  },
  {
    id: "p4",
    title: "مغازه ۴۵ متری نارمک",
    deal: "rent",
    type: "shop",
    area: 45,
    rooms: 0,
    floor: "همکف",
    year: 1390,
    city: "تهران",
    district: "نارمک",
    address: "میدان ۵۰ متری، ضلع شمالی",
    deposit: 300_000_000,
    rent: 45_000_000,
    ownerName: "آقای موحد",
    ownerPhone: "۰۹۱۹۸۸۷۷۶۶۵",
    features: ["سند تک‌برگ"],
    photos: [],
    note: "مناسب کافه و فروشگاه پوشاک.",
    createdAt: iso(-5),
  },
  {
    id: "p5",
    title: "دفتر کار ۹۰ متری جردن",
    deal: "sale",
    type: "office",
    area: 90,
    rooms: 3,
    floor: "۷ از ۱۲",
    year: 1400,
    city: "تهران",
    district: "جردن",
    address: "خیابان نلسون ماندلا، برج آفتاب",
    price: 14_200_000_000,
    ownerName: "شرکت آریا",
    ownerPhone: "۰۲۱۸۸۷۷۶۶۵۵",
    features: ["آسانسور", "پارکینگ", "انباری"],
    photos: [],
    note: "دارای پروانه اداری.",
    createdAt: iso(-6),
  },
];

export const initialClients: Client[] = [
  {
    id: "c1",
    name: "مهدی احمدی",
    phone: "۰۹۱۲۳۳۴۴۵۵۶",
    interest: "sale",
    type: "apartment",
    budget: 10_000_000_000,
    district: "سعادت‌آباد",
    minArea: 110,
    rooms: 2,
    note: "به دنبال واحد نوساز با پارکینگ.",
    createdAt: iso(-1),
  },
  {
    id: "c2",
    name: "سارا نوری",
    phone: "۰۹۳۹۵۵۶۶۷۷۸",
    interest: "rent",
    type: "apartment",
    budget: 40_000_000,
    district: "پونک",
    minArea: 70,
    rooms: 2,
    note: "تحویل فوری لازم دارد.",
    createdAt: iso(-2),
  },
  {
    id: "c3",
    name: "رضا شریفی",
    phone: "۰۹۱۲۹۹۸۸۷۷۶",
    interest: "sale",
    type: "villa",
    budget: 50_000_000_000,
    district: "ولنجک",
    minArea: 300,
    rooms: 4,
    note: "امکان پرداخت نقدی دارد.",
    createdAt: iso(-4),
  },
  {
    id: "c4",
    name: "الهام رحیمی",
    phone: "۰۹۱۲۴۴۵۵۶۶۷",
    interest: "rent",
    type: "shop",
    budget: 50_000_000,
    district: "نارمک",
    minArea: 40,
    rooms: 0,
    note: "برای راه‌اندازی کافه.",
    createdAt: iso(-7),
  },
];

export const initialFollowUps: FollowUp[] = [
  {
    id: "f1",
    clientName: "مهدی احمدی",
    subject: "هماهنگی بازدید آپارتمان سعادت‌آباد",
    date: iso(0),
    time: "۱۰:۳۰",
    channel: "call",
    done: false,
  },
  {
    id: "f2",
    clientName: "سارا نوری",
    subject: "ارسال گزینه‌های اجاره پونک",
    date: iso(0),
    time: "۱۴:۰۰",
    channel: "message",
    done: false,
  },
  {
    id: "f3",
    clientName: "رضا شریفی",
    subject: "بازدید ویلا ولنجک",
    date: iso(1),
    time: "۱۱:۰۰",
    channel: "visit",
    done: false,
  },
  {
    id: "f4",
    clientName: "الهام رحیمی",
    subject: "پیگیری قیمت مغازه نارمک",
    date: iso(3),
    time: "۱۶:۳۰",
    channel: "call",
    done: false,
  },
  {
    id: "f5",
    clientName: "مهدی احمدی",
    subject: "ارسال مدارک ملک",
    date: iso(-1),
    time: "۰۹:۰۰",
    channel: "message",
    done: true,
  },
];
