import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/app-shell";
import { StorageNote } from "@/components/data-state";
import { PropertyForm } from "@/components/property-form";
import { usePropertySource } from "@/lib/use-properties";

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
  const { addProperty, cloud, saving } = usePropertySource();
  const navigate = useNavigate();

  return (
    <Screen>
      <TopBar title="ثبت ملک جدید" subtitle="مشخصات فایل را کامل کنید" back="/properties" />
      <div className="px-4 pt-4">
        <StorageNote cloud={cloud} />
      </div>
      <PropertyForm
        submitLabel="ثبت ملک"
        pending={saving}
        onSubmit={(draft) => {
          void (async () => {
            try {
              const id = await addProperty(draft);
              toast.success(cloud ? "ملک در حساب دفتر شما ثبت شد" : "ملک روی همین دستگاه ذخیره شد");
              navigate({ to: "/properties/$propertyId", params: { propertyId: id } });
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "ثبت ملک انجام نشد.");
            }
          })();
        }}
      />
    </Screen>
  );
}
