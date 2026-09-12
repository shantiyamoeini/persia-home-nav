import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/app-shell";
import { CardSkeleton, StorageNote } from "@/components/data-state";
import { PropertyForm } from "@/components/property-form";
import { usePropertySource } from "@/lib/use-properties";

export const Route = createFileRoute("/properties/$propertyId/edit")({
  head: () => ({
    meta: [
      { title: "ویرایش ملک | دستیار املاک" },
      {
        name: "description",
        content: "ویرایش مشخصات، قیمت، امکانات، وضعیت و اطلاعات خصوصی مالک برای فایل ملک.",
      },
      { property: "og:title", content: "ویرایش ملک" },
      { property: "og:description", content: "ویرایش مشخصات و عکس‌های فایل ملک." },
    ],
  }),
  component: EditProperty,
});

function EditProperty() {
  const { propertyId } = Route.useParams();
  const { properties, updateProperty, loading, cloud, saving } = usePropertySource();
  const navigate = useNavigate();
  const property = properties.find((p) => p.id === propertyId);

  if (loading) {
    return (
      <Screen>
        <TopBar title="ویرایش ملک" back="/properties" />
        <div className="p-4">
          <CardSkeleton count={2} />
        </div>
      </Screen>
    );
  }

  if (!property) {
    return (
      <Screen>
        <TopBar title="ویرایش ملک" back="/properties" />
        <div className="p-4">
          <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
            این فایل ملک پیدا نشد.
          </p>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="ویرایش ملک" subtitle={property.title} back="/properties" />
      <div className="px-4 pt-4">
        <StorageNote cloud={cloud} />
      </div>
      <PropertyForm
        initial={property}
        submitLabel="ذخیره تغییرات"
        pending={saving}
        onSubmit={(draft) => {
          void (async () => {
            try {
              await updateProperty(property.id, draft);
              toast.success("تغییرات ذخیره شد");
              navigate({ to: "/properties/$propertyId", params: { propertyId: property.id } });
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "ذخیره تغییرات انجام نشد.");
            }
          })();
        }}
      />
    </Screen>
  );
}
