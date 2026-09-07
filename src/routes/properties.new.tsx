import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/app-shell";
import { LocalOnlyNote } from "@/components/local-note";
import { PropertyForm } from "@/components/property-form";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/properties/new")({
  head: () => ({
    meta: [
      { title: "ثبت ملک جدید | دستیار املاک" },
      {
        name: "description",
        content: "فرم ثبت فایل ملک با مشخصات کامل، عکس‌ها، قیمت، امکانات و اطلاعات مالک.",
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

  return (
    <Screen>
      <TopBar title="ثبت ملک جدید" subtitle="مشخصات فایل را کامل کنید" back="/properties" />
      <div className="px-4 pt-4">
        <LocalOnlyNote />
      </div>
      <PropertyForm
        submitLabel="ثبت ملک"
        onSubmit={(draft) => {
          const id = addProperty(draft);
          toast.success("ملک روی همین دستگاه ذخیره شد");
          navigate({ to: "/properties/$propertyId", params: { propertyId: id } });
        }}
      />
    </Screen>
  );
}
