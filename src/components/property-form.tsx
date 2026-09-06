import { useState } from "react";
import { toast } from "sonner";
import { Chip } from "./app-shell";
import { PhotoUploader } from "./photo-uploader";
import {
  Field,
  SegmentedControl,
  SelectInput,
  SubmitBar,
  TextArea,
  TextInput,
} from "./form-kit";
import type { PropertyInput } from "@/lib/api";
import {
  districts,
  featureOptions,
  propertyTypeLabels,
  type Deal,
  type Property,
  type PropertyType,
} from "@/lib/data";

function toForm(p?: Property): PropertyInput {
  return {
    title: p?.title ?? "",
    deal: p?.deal ?? "sale",
    type: p?.type ?? "apartment",
    area: p?.area ?? 0,
    rooms: p?.rooms ?? 0,
    floor: p?.floor ?? "",
    build_year: p?.build_year ?? 1400,
    city: p?.city ?? "تهران",
    district: p?.district ?? districts[0]!,
    address: p?.address ?? "",
    price: p?.price ?? null,
    deposit: p?.deposit ?? null,
    rent: p?.rent ?? null,
    owner_name: p?.owner_name ?? "",
    owner_phone: p?.owner_phone ?? "",
    features: p?.features ?? [],
    note: p?.note ?? "",
    photos: p?.photos ?? [],
  };
}

const million = 1_000_000;

export function PropertyForm({
  property,
  pending,
  submitLabel,
  onSubmit,
}: {
  property?: Property;
  pending?: boolean;
  submitLabel: string;
  onSubmit: (input: PropertyInput) => void;
}) {
  const [form, setForm] = useState<PropertyInput>(() => toForm(property));
  const set = <K extends keyof PropertyInput>(key: K, value: PropertyInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleFeature = (feature: string) =>
    set(
      "features",
      form.features.includes(feature)
        ? form.features.filter((f) => f !== feature)
        : [...form.features, feature],
    );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("عنوان ملک را وارد کنید");
      return;
    }
    if (!form.area) {
      toast.error("متراژ ملک را وارد کنید");
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4 px-4 py-5">
      <Field label="عنوان ملک">
        <TextInput
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="مثلاً آپارتمان ۹۵ متری سعادت‌آباد"
        />
      </Field>

      <Field label="نوع معامله">
        <SegmentedControl<Deal>
          value={form.deal}
          onChange={(v) => set("deal", v)}
          options={[
            { value: "sale", label: "فروش" },
            { value: "rent", label: "اجاره" },
          ]}
        />
      </Field>

      <Field label="عکس‌های ملک" hint="با دکمه‌های جهت، ترتیب نمایش عکس‌ها را تغییر دهید.">
        <PhotoUploader paths={form.photos} onChange={(next) => set("photos", next)} />
      </Field>

      <Field label="نوع ملک">
        <SelectInput
          value={form.type}
          onChange={(e) => set("type", e.target.value as PropertyType)}
        >
          {Object.entries(propertyTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectInput>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="متراژ (متر)">
          <TextInput
            inputMode="numeric"
            value={form.area || ""}
            onChange={(e) => set("area", Number(e.target.value) || 0)}
          />
        </Field>
        <Field label="تعداد اتاق">
          <TextInput
            inputMode="numeric"
            value={form.rooms || ""}
            onChange={(e) => set("rooms", Number(e.target.value) || 0)}
          />
        </Field>
        <Field label="طبقه">
          <TextInput value={form.floor} onChange={(e) => set("floor", e.target.value)} />
        </Field>
        <Field label="سال ساخت">
          <TextInput
            inputMode="numeric"
            value={form.build_year || ""}
            onChange={(e) => set("build_year", Number(e.target.value) || 0)}
          />
        </Field>
        <Field label="شهر">
          <TextInput value={form.city} onChange={(e) => set("city", e.target.value)} />
        </Field>
        <Field label="محله">
          <SelectInput
            value={form.district}
            onChange={(e) => set("district", e.target.value)}
          >
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <Field label="آدرس">
        <TextInput
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder="خیابان، کوچه، پلاک"
        />
      </Field>

      {form.deal === "sale" ? (
        <Field label="قیمت فروش (میلیون تومان)">
          <TextInput
            inputMode="numeric"
            value={form.price ? form.price / million : ""}
            onChange={(e) =>
              set("price", e.target.value ? Number(e.target.value) * million : null)
            }
          />
        </Field>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label="ودیعه (میلیون)">
            <TextInput
              inputMode="numeric"
              value={form.deposit ? form.deposit / million : ""}
              onChange={(e) =>
                set("deposit", e.target.value ? Number(e.target.value) * million : null)
              }
            />
          </Field>
          <Field label="اجاره ماهانه (میلیون)">
            <TextInput
              inputMode="numeric"
              value={form.rent ? form.rent / million : ""}
              onChange={(e) =>
                set("rent", e.target.value ? Number(e.target.value) * million : null)
              }
            />
          </Field>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="نام مالک">
          <TextInput
            value={form.owner_name}
            onChange={(e) => set("owner_name", e.target.value)}
          />
        </Field>
        <Field label="شماره تماس مالک">
          <TextInput
            dir="ltr"
            inputMode="tel"
            value={form.owner_phone}
            onChange={(e) => set("owner_phone", e.target.value)}
          />
        </Field>
      </div>

      <Field label="امکانات">
        <div className="flex flex-wrap gap-2">
          {featureOptions.map((feature) => {
            const active = form.features.includes(feature);
            return (
              <button key={feature} type="button" onClick={() => toggleFeature(feature)}>
                <Chip tone={active ? "primary" : "muted"}>{feature}</Chip>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="توضیحات">
        <TextArea
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
          placeholder="نکات مهم ملک، شرایط پرداخت و..."
        />
      </Field>

      <SubmitBar label={submitLabel} pending={pending} />
    </form>
  );
}
