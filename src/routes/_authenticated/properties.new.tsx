import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/app-shell";
import { PropertyForm } from "@/components/property-form";
import { createProperty, queryKeys } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/properties/new")({
  head: () => ({
    meta: [
      { title: "ثبت ملک جدید | دستیار مشاور املاک" },
      { name: "description", content: "ثبت فایل ملک با مشخصات کامل و چند عکس." },
      { property: "og:title", content: "ثبت ملک جدید" },
      { property: "og:description", content: "ثبت فایل ملک با مشخصات کامل و چند عکس." },
    ],
  }),
  component: NewProperty,
});

function NewProperty() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.properties });
      toast.success("ملک ثبت شد");
      navigate({ to: "/properties" });
    },
    onError: (error) => toast.error(error.message || "ثبت ملک ناموفق بود"),
  });

  return (
    <Screen>
      <TopBar title="ثبت ملک جدید" subtitle="مشخصات فایل را کامل کنید" back="/properties" />
      <PropertyForm
        submitLabel="ثبت ملک"
        pending={create.isPending}
        onSubmit={(input) => create.mutate(input)}
      />
    </Screen>
  );
}
