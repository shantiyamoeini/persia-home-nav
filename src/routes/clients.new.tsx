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
import { districts, propertyTypeLabels, type Deal, type PropertyType } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/clients/new")({
  head: () => ({
    meta: [
      { title: "ثبت مشتری جدید | دستیار املاک" },
      {
        name: "description",
        content: "فرم ثبت مشتری با نوع درخواست، بودجه، محله مورد نظر و توضیحات.",
      },
      { property: "og:title", content: "ثبت مشتری جدید" },
      { property: "og:description", content: "فرم ثبت مشتری با بودجه و نیازها." },
    ],
  }),
  component: AddClient,
});

function AddClient() {
  const { addClient } = useStore();
  const navigate = useNavigate();
  const [interest, setInterest] = useState<Deal>("sale");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const num = (k: string) => Number(fd.get(k) || 0);
    addClient({
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
    toast.success("مشتری با موفقیت ثبت شد");
    navigate({ to: "/clients" });
  };

  return (
    <Screen>
      <TopBar title="ثبت مشتری جدید" subtitle="نیاز مشتری را دقیق ثبت کنید" back="/clients" />
      <form onSubmit={onSubmit} className="space-y-4 p-4">
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
            <TextInput name="name" required placeholder="مهدی احمدی" />
          </Field>
          <Field label="شماره تماس">
            <TextInput name="phone" inputMode="tel" placeholder="۰۹۱۲..." />
          </Field>
          <Field label="نوع ملک مورد نظر">
            <SelectInput name="type" defaultValue="apartment">
              {Object.entries(propertyTypeLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="محله مورد نظر">
            <SelectInput name="district" defaultValue={districts[0]}>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="حداقل متراژ">
            <TextInput name="minArea" type="number" min="0" placeholder="۸۰" />
          </Field>
          <Field label="تعداد اتاق">
            <TextInput name="rooms" type="number" min="0" defaultValue={2} />
          </Field>
        </div>

        <Field
          label={interest === "sale" ? "بودجه خرید" : "بودجه اجاره ماهانه"}
          hint="مبلغ را به میلیون تومان وارد کنید"
        >
          <TextInput name="budget" type="number" min="0" placeholder="۵۰۰۰" />
        </Field>

        <Field label="توضیحات">
          <TextArea name="note" placeholder="اولویت‌ها و شرایط خاص مشتری..." />
        </Field>

        <SubmitBar label="ثبت مشتری" />
      </form>
    </Screen>
  );
}
