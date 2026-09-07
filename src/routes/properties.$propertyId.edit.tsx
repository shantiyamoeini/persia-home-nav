import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/app-shell";
import { LocalOnlyNote } from "@/components/local-note";
import { PropertyForm } from "@/components/property-form";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/properties/$propertyId/edit")({
  head: () => ({
    meta: [
      { title: "ویرایش ملک | دستیار املاک" },
      {
        name: "description",
        content: "ویرایش مشخصات، قیمت، امکانات و عکس‌های فایل ملک ذخیره‌شده روی همین دستگاه.",
      },
      { property: "og:title", content: "ویرایش ملک" },
      { property: "og:description", content: "ویرایش مشخصات و عکس‌های فایل ملک." },
    ],
  }),
  component: EditProperty,
});

function EditProperty() {
  const { propertyId } = Route.useParams();
  const { properties, updateProperty, ready } = useStore();
  const navigate = useNavigate();
  const property = properties.find((p) => p.id === propertyId);

  if (!property) {
    return (
      <Screen>
        <TopBar title="ویرایش ملک" back="/properties" />
        <div className="p-4">
          <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
            {ready ? "این فایل روی این دستگاه پیدا نشد." : "در حال بارگذاری..."}
          </p>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="ویرایش ملک" subtitle={property.title} back="/properties" />
      <div className="px-4 pt-4">
        <LocalOnlyNote />
      </div>
      <PropertyForm
        initial={property}
        submitLabel="ذخیره تغییرات"
        onSubmit={(draft) => {
          updateProperty(property.id, draft);
          toast.success("تغییرات ذخیره شد");
          navigate({ to: "/properties/$propertyId", params: { propertyId: property.id } });
        }}
      />
    </Screen>
  );
}
