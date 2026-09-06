import { useState } from "react";
import { toast } from "sonner";
import {
  Field,
  SegmentedControl,
  SelectInput,
  SubmitBar,
  TextArea,
  TextInput,
} from "./form-kit";
import type { ClientInput } from "@/lib/api";
import {
  districts,
  propertyTypeLabels,
  type Client,
  type Deal,
  type PropertyType,
} from "@/lib/data";

const million = 1_000_000;

function toForm(c?: Client): ClientInput {
  return {
    name: c?.name ?? "",
    phone: c?.phone ?? "",
    interest: c?.interest ?? "sale",
    type: c?.type ?? "apartment",
    budget: c?.budget ?? 0,
    district: c?.district ?? districts[0]!,
    min_area: c?.min_area ?? 0,
    rooms: c?.rooms ?? 0,
    note: c?.note ?? "",
  };
}

export function ClientForm({
  client,
  pending,
  submitLabel,
  onSubmit,
}: {
  client?: Client;
  pending?: boolean;
  submitLabel: string;
  onSubmit: (input: ClientInput) => void;
}) {
  const [form, setForm] = useState<ClientInput>(() => toForm(client));
  const set = <K extends keyof ClientInput>(key: K, value: ClientInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("نام مشتری را وارد کنید");
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4 px-4 py-5">
      <Field label="نام و نام خانوادگی">
        <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} />
      </Field>

      <Field label="شماره تماس">
        <TextInput
          dir="ltr"
          inputMode="tel"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="0912..."
        />
      </Field>

      <Field label="متقاضی">
        <SegmentedControl<Deal>
          value={form.interest}
          onChange={(v) => set("interest", v)}
          options={[
            { value: "sale", label: "خرید" },
            { value: "rent", label: "اجاره" },
          ]}
        />
      </Field>

      <Field label="نوع ملک مورد نظر">
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

      <Field label="بودجه (میلیون تومان)">
        <TextInput
          inputMode="numeric"
          value={form.budget ? form.budget / million : ""}
          onChange={(e) => set("budget", Number(e.target.value) * million || 0)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="محله مورد نظر">
          <SelectInput value={form.district} onChange={(e) => set("district", e.target.value)}>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="حداقل متراژ">
          <TextInput
            inputMode="numeric"
            value={form.min_area || ""}
            onChange={(e) => set("min_area", Number(e.target.value) || 0)}
          />
        </Field>
      </div>

      <Field label="تعداد اتاق مورد نیاز">
        <TextInput
          inputMode="numeric"
          value={form.rooms || ""}
          onChange={(e) => set("rooms", Number(e.target.value) || 0)}
        />
      </Field>

      <Field label="یادداشت">
        <TextArea
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
          placeholder="شرایط و اولویت‌های مشتری"
        />
      </Field>

      <SubmitBar label={submitLabel} pending={pending} />
    </form>
  );
}
