import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/app-shell";
import {
  Field,
  SegmentedControl,
  SelectInput,
  SubmitBar,
  TextArea,
  TextInput,
} from "@/components/form-kit";
import {
  districts,
  featureOptions,
  propertyTypeLabels,
  type Deal,
  type PropertyType,
} from "@/lib/data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/properties/new")({
  head: () => ({
    meta: [
      { title: "ثبت ملک جدید | دستیار املاک" },
      {
        name: "description",
        content: "فرم ثبت فایل ملک با مشخصات کامل، قیمت، امکانات و اطلاعات مالک.",
      },
      { property: "og:title", content: "ثبت ملک جدید" },
      { property: "og:description", content: "فرم ثبت فایل ملک با مشخصات کامل." },
    ],
  }),
  component: AddProperty,
});

function AddProperty() {
  const { addProperty } = useStore();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal>("sale");
  const [features, setFeatures] = useState<string[]>([]);

  const toggleFeature = (f: string) =>
    setFeatures((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const num = (k: string) => Number(fd.get(k) || 0);
    addProperty({
      title: String(fd.get("title") || "ملک بدون عنوان"),
      deal,
      type: String(fd.get("type")) as PropertyType,
      area: num("area"),
      rooms: num("rooms"),
      floor: String(fd.get("floor") || "-"),
      year: num("year") || 1400,
      city: String(fd.get("city") || "تهران"),
      district: String(fd.get("district")),
      address: String(fd.get("address") || ""),
      price: deal === "sale" ? num("price") * 1_000_000 : undefined,
      deposit: deal === "rent" ? num("deposit") * 1_000_000 : undefined,
      rent: deal === "rent" ? num("rent") * 1_000_000 : undefined,
      ownerName: String(fd.get("ownerName") || ""),
      ownerPhone: String(fd.get("ownerPhone") || ""),
      features,
      note: String(fd.get("note") || ""),
    });
    toast.success("ملک با موفقیت ثبت شد");
    navigate({ to: "/properties" });
  };

  return (
    <Screen>
      <TopBar title="ثبت ملک جدید" subtitle="مشخصات فایل را کامل کنید" back="/properties" />
      <form onSubmit={onSubmit} className="space-y-4 p-4">
        <Field label="نوع معامله">
          <SegmentedControl
            value={deal}
            onChange={setDeal}
            options={[
              { value: "sale", label: "فروش" },
              { value: "rent", label: "اجاره" },
            ]}
          />
        </Field>

        <Field label="عنوان ملک">
          <TextInput name="title" required placeholder="مثلاً آپارتمان ۱۰۰ متری سعادت‌آباد" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="نوع ملک">
            <SelectInput name="type" defaultValue="apartment">
              {Object.entries(propertyTypeLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="متراژ (متر مربع)">
            <TextInput name="area" type="number" min="0" required placeholder="۱۰۰" />
          </Field>
          <Field label="تعداد اتاق">
            <TextInput name="rooms" type="number" min="0" defaultValue={2} />
          </Field>
          <Field label="طبقه">
            <TextInput name="floor" placeholder="۳ از ۶" />
          </Field>
          <Field label="سال ساخت">
            <TextInput name="year" type="number" placeholder="۱۳۹۹" />
          </Field>
          <Field label="شهر">
            <TextInput name="city" defaultValue="تهران" />
          </Field>
        </div>

        <Field label="محله">
          <SelectInput name="district" defaultValue={districts[0]}>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </SelectInput>
        </Field>

        <Field label="آدرس">
          <TextArea name="address" placeholder="خیابان، کوچه، پلاک..." />
        </Field>

        {deal === "sale" ? (
          <Field label="قیمت کل" hint="مبلغ را به میلیون تومان وارد کنید">
            <TextInput name="price" type="number" min="0" placeholder="۹۵۰۰" />
          </Field>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="ودیعه" hint="میلیون تومان">
              <TextInput name="deposit" type="number" min="0" placeholder="۵۰۰" />
            </Field>
            <Field label="اجاره ماهانه" hint="میلیون تومان">
              <TextInput name="rent" type="number" min="0" placeholder="۳۰" />
            </Field>
          </div>
        )}

        <Field label="امکانات">
          <div className="flex flex-wrap gap-2">
            {featureOptions.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => toggleFeature(f)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                  features.includes(f)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="نام مالک">
            <TextInput name="ownerName" placeholder="آقای رستمی" />
          </Field>
          <Field label="شماره تماس مالک">
            <TextInput name="ownerPhone" inputMode="tel" placeholder="۰۹۱۲..." />
          </Field>
        </div>

        <Field label="توضیحات">
          <TextArea name="note" placeholder="نکات مهم برای بازدید و مذاکره..." />
        </Field>

        <SubmitBar label="ثبت ملک" />
      </form>
    </Screen>
  );
}
