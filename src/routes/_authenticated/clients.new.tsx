import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/app-shell";
import { ClientForm } from "@/components/client-form";
import { createClient, queryKeys } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/clients/new")({
  head: () => ({
    meta: [
      { title: "ثبت مشتری جدید | دستیار مشاور املاک" },
      { name: "description", content: "ثبت مشتری با بودجه، محله و نیاز ملکی." },
      { property: "og:title", content: "ثبت مشتری جدید" },
      { property: "og:description", content: "ثبت مشتری با بودجه و نیاز ملکی." },
    ],
  }),
  component: NewClient,
});

function NewClient() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: createClient,
    onSuccess: (client) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      toast.success("مشتری ثبت شد");
      navigate({ to: "/clients/$id", params: { id: client.id } });
    },
    onError: (error) => toast.error(error.message || "ثبت مشتری ناموفق بود"),
  });

  return (
    <Screen>
      <TopBar title="ثبت مشتری جدید" subtitle="نیاز مشتری را دقیق وارد کنید" back="/clients" />
      <ClientForm
        submitLabel="ثبت مشتری"
        pending={create.isPending}
        onSubmit={(input) => create.mutate(input)}
      />
    </Screen>
  );
}
