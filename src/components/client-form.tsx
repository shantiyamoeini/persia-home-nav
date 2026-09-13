import { useState } from "react";
import { toast } from "sonner";
import {
  Field,
  SegmentedControl,
  SelectInput,
  SubmitBar,
  TextArea,
  TextInput,
} from "@/components/form-kit";
import { validateClientInput, type ClientInput } from "@/lib/clients.functions";
import { propertyTypeLabels, type Client, type Deal } from "@/lib/data";
import { formatIranPhone } from "@/lib/phone";

export type ClientDraft = ClientInput;

const million = 1_000_000;
const toMillion = (v?: number) => (v && v > 0 ? Math.round(v / million) : undefined);

export function ClientForm({
  initial,
  submitLabel,
  pending = false,
  onSubmit,
}: {
  initial?: Client | undefined;
  submitLabel: string;
  pending?: boolean;
  onSubmit: (draft: ClientDraft) => void;
}) {
  const [interest, setInterest] = useState<Deal>(initial?.interest ?? "sale");

  const handle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const num = (k: string) => Number(fd.get(k) || 0);
    try {
      const draft = validateClientInput({
        name: String(fd.get("name") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        interest,
        type: String(fd.get("type")) as ClientInput["type"],
        budget: num("budget") * million,
        budgetMax: num("budgetMax") * million,
        districts: String(fd.get("districts") ?? ""),
        district: "",
        minArea: num("minArea"),
        maxArea: num("maxArea"),
        rooms: num("rooms"),
        requirements: String(fd.get("requirements") ?? ""),
        note: String(fd.get("note") ?? ""),
      });
      onSubmit(draft);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "اطلاعات وارد‌شده کامل نیست.");
    }
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
        <Field label="شماره تماس" hint="مثل ۰۹۱۲۳۴۵۶۷۸۹">
          <TextInput
            name="phone"
            inputMode="tel"
            defaultValue={initial?.phone ? formatIranPhone(initial.phone) : ""}
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
        <Field label="تعداد اتاق">
          <TextInput name="rooms" type="number" min="0" defaultValue={initial?.rooms ?? 2} />
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
        <Field label="حداکثر متراژ">
          <TextInput
            name="maxArea"
            type="number"
            min="0"
            defaultValue={initial?.maxArea || undefined}
            placeholder="۱۲۰"
          />
        </Field>
      </div>

      <Field label="محله‌های مورد نظر" hint="می‌توانید چند محله را با ویرگول جدا کنید">
        <TextInput
          name="districts"
          defaultValue={initial?.districts || initial?.district || ""}
          placeholder="سعادت‌آباد، پونک"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label={interest === "sale" ? "حداقل بودجه خرید" : "حداقل بودجه اجاره"}
          hint="به میلیون تومان"
        >
          <TextInput
            name="budget"
            type="number"
            min="0"
            defaultValue={toMillion(initial?.budget)}
            placeholder="۵۰۰۰"
          />
        </Field>
        <Field label="حداکثر بودجه" hint="به میلیون تومان">
          <TextInput
            name="budgetMax"
            type="number"
            min="0"
            defaultValue={toMillion(initial?.budgetMax)}
            placeholder="۷۰۰۰"
          />
        </Field>
      </div>

      <Field label="نیازهای مشتری">
        <TextArea
          name="requirements"
          defaultValue={initial?.requirements}
          placeholder="نوساز، پارکینگ، آسانسور..."
        />
      </Field>

      <Field label="یادداشت داخلی">
        <TextArea name="note" defaultValue={initial?.note} placeholder="شرایط خاص مشتری..." />
      </Field>

      <SubmitBar label={submitLabel} pending={pending} />
    </form>
  );
}
