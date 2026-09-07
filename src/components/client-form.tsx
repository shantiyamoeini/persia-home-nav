import { useState } from "react";
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
  propertyTypeLabels,
  type Client,
  type Deal,
  type PropertyType,
} from "@/lib/data";

export type ClientDraft = Omit<Client, "id" | "createdAt">;

export function ClientForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Client | undefined;
  submitLabel: string;
  onSubmit: (draft: ClientDraft) => void;
}) {
  const [interest, setInterest] = useState<Deal>(initial?.interest ?? "sale");

  const handle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const num = (k: string) => Number(fd.get(k) || 0);
    onSubmit({
      name: String(fd.get("name") || "بدون نام"),
      phone: String(fd.get("phone") || ""),
      interest,
      type: String(fd.get("type")) as PropertyType,
      budget: num("budget") * 1_000_000,
      district: String(fd.get("district")),
      minArea: num("minArea"),
      rooms: num("rooms"),
      note: String(fd.get("note") || ""),
    });
  };

  return (
    <form onSubmit={handle} className="space-y-4 p-4">
      <Field label="نوع درخواست">
        <SegmentedControl
          value={interest}
          onChange={setInterest}
          options={[
            { value: "sale", label: "متقاضی خرید" },
            { value: "rent", label: "متقاضی اجاره" },
          ]}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="نام و نام خانوادگی">
          <TextInput name="name" required defaultValue={initial?.name} placeholder="مهدی احمدی" />
        </Field>
        <Field label="شماره تماس">
          <TextInput
            name="phone"
            inputMode="tel"
            defaultValue={initial?.phone}
            placeholder="۰۹۱۲..."
          />
        </Field>
        <Field label="نوع ملک مورد نظر">
          <SelectInput name="type" defaultValue={initial?.type ?? "apartment"}>
            {Object.entries(propertyTypeLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="محله مورد نظر">
          <SelectInput name="district" defaultValue={initial?.district ?? districts[0]}>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="حداقل متراژ">
          <TextInput
            name="minArea"
            type="number"
            min="0"
            defaultValue={initial?.minArea}
            placeholder="۸۰"
          />
        </Field>
        <Field label="تعداد اتاق">
          <TextInput name="rooms" type="number" min="0" defaultValue={initial?.rooms ?? 2} />
        </Field>
      </div>

      <Field
        label={interest === "sale" ? "بودجه خرید" : "بودجه اجاره ماهانه"}
        hint="مبلغ را به میلیون تومان وارد کنید"
      >
        <TextInput
          name="budget"
          type="number"
          min="0"
          defaultValue={initial?.budget ? Math.round(initial.budget / 1_000_000) : undefined}
          placeholder="۵۰۰۰"
        />
      </Field>

      <Field label="توضیحات">
        <TextArea name="note" defaultValue={initial?.note} placeholder="اولویت‌ها و شرایط خاص مشتری..." />
      </Field>

      <SubmitBar label={submitLabel} />
    </form>
  );
}
