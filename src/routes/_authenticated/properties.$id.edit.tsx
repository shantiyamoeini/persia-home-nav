import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/app-shell";
import { PropertyForm } from "@/components/property-form";
import { ErrorState, LoadingState } from "@/components/states";
import { getProperty, queryKeys, updateProperty } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/properties/$id/edit")({
  head: () => ({
    meta: [
      { title: "ویرایش ملک | دستیار مشاور املاک" },
      { name: "description", content: "ویرایش مشخصات و عکس‌های فایل ملک." },
      { property: "og:title", content: "ویرایش ملک" },
      { property: "og:description", content: "ویرایش مشخصات و عکس‌های فایل ملک." },
    ],
  }),
  component: EditProperty,
});

function EditProperty() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const property = useQuery({
    queryKey: queryKeys.property(id),
    queryFn: () => getProperty(id),
  });

  const save = useMutation({
    mutationFn: (input: Parameters<typeof updateProperty>[1]) => updateProperty(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.properties });
      toast.success("تغییرات ذخیره شد");
      navigate({ to: "/properties" });
    },
    onError: (error) => toast.error(error.message || "ذخیره تغییرات ناموفق بود"),
  });

  return (
    <Screen>
      <TopBar title="ویرایش ملک" back="/properties" />
      {property.isLoading ? (
        <div className="px-4 py-5">
          <LoadingState />
        </div>
      ) : property.isError || !property.data ? (
        <div className="px-4 py-5">
          <ErrorState text="این ملک پیدا نشد." onRetry={() => property.refetch()} />
        </div>
      ) : (
        <PropertyForm
          property={property.data}
          submitLabel="ذخیره تغییرات"
          pending={save.isPending}
          onSubmit={(input) => save.mutate(input)}
        />
      )}
    </Screen>
  );
}
