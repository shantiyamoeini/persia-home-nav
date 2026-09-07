import { useState } from "react";
import {
  Field,
  SegmentedControl,
  SelectInput,
  SubmitBar,
  TextArea,
  TextInput,
} from "@/components/form-kit";
import { PhotoPicker } from "@/components/photo-picker";
import {
  districts,
  featureOptions,
  propertyTypeLabels,
  type Deal,
  type Property,
  type PropertyType,
} from "@/lib/data";
import { cn } from "@/lib/utils";

export type PropertyDraft = Omit<Property, "id" | "createdAt">;

const million = (v: number) => Math.round(v / 1_000_000);

export function PropertyForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Property | undefined;
  submitLabel: string;
  onSubmit: (draft: PropertyDraft) => void;
}) {
  const [deal, setDeal] = useState<Deal>(initial?.deal ?? "sale");
  const [features, setFeatures] = useState<string[]>(initial?.features ?? []);
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);

  const toggleFeature = (f: string) =>
    setFeatures((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  const handle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const num = (k: string) => Number(fd.get(k) || 0);
    onSubmit({
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
      photos,
      note: String(fd.get("note") || ""),
    });
  };

  return (
    <form onSubmit={handle} className="space-y-4 p-4">
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
        <TextInput
          name="title"
          required
          defaultValue={initial?.title}
          placeholder="مثلاً آپارتمان ۱۰۰ متری سعادت‌آباد"
        />
      </Field>

      <Field label="عکس‌های ملک" hint="با دکمه‌های کنار هر عکس ترتیب را تغییر دهید">
        <PhotoPicker photos={photos} onChange={setPhotos} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="نوع ملک">
          <SelectInput name="type" defaultValue={initial?.type ?? "apartment"}>
            {Object.entries(propertyTypeLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="متراژ (متر مربع)">
          <TextInput
            name="area"
            type="number"
            min="0"
            required
            defaultValue={initial?.area}
            placeholder="۱۰۰"
          />
        </Field>
        <Field label="تعداد اتاق">
          <TextInput name="rooms" type="number" min="0" defaultValue={initial?.rooms ?? 2} />
        </Field>
        <Field label="طبقه">
          <TextInput name="floor" defaultValue={initial?.floor} placeholder="۳ از ۶" />
        </Field>
        <Field label="سال ساخت">
          <TextInput name="year" type="number" defaultValue={initial?.year} placeholder="۱۳۹۹" />
        </Field>
        <Field label="شهر">
          <TextInput name="city" defaultValue={initial?.city ?? "تهران"} />
        </Field>
      </div>

      <Field label="محله">
        <SelectInput name="district" defaultValue={initial?.district ?? districts[0]}>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </SelectInput>
      </Field>

      <Field label="آدرس">
        <TextArea name="address" defaultValue={initial?.address} placeholder="خیابان، کوچه، پلاک..." />
      </Field>

      {deal === "sale" ? (
        <Field label="قیمت کل" hint="مبلغ را به میلیون تومان وارد کنید">
          <TextInput
            name="price"
            type="number"
            min="0"
            defaultValue={initial?.price ? million(initial.price) : undefined}
            placeholder="۹۵۰۰"
          />
        </Field>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="ودیعه" hint="میلیون تومان">
            <TextInput
              name="deposit"
              type="number"
              min="0"
              defaultValue={initial?.deposit ? million(initial.deposit) : undefined}
              placeholder="۵۰۰"
            />
          </Field>
          <Field label="اجاره ماهانه" hint="میلیون تومان">
            <TextInput
              name="rent"
              type="number"
              min="0"
              defaultValue={initial?.rent ? million(initial.rent) : undefined}
              placeholder="۳۰"
            />
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
          <TextInput name="ownerName" defaultValue={initial?.ownerName} placeholder="آقای رستمی" />
        </Field>
        <Field label="شماره تماس مالک">
          <TextInput
            name="ownerPhone"
            inputMode="tel"
            defaultValue={initial?.ownerPhone}
            placeholder="۰۹۱۲..."
          />
        </Field>
      </div>

      <Field label="توضیحات">
        <TextArea name="note" defaultValue={initial?.note} placeholder="نکات مهم برای بازدید و مذاکره..." />
      </Field>

      <SubmitBar label={submitLabel} />
    </form>
  );
}
