import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/app-shell";
import { ClientForm } from "@/components/client-form";
import { ErrorState, LoadingState } from "@/components/states";
import { getClient, queryKeys, updateClient } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/clients/$id/edit")({
  head: () => ({
    meta: [
      { title: "ویرایش مشتری | دستیار مشاور املاک" },
      { name: "description", content: "ویرایش اطلاعات و نیاز ملکی مشتری." },
      { property: "og:title", content: "ویرایش مشتری" },
      { property: "og:description", content: "ویرایش اطلاعات و نیاز ملکی مشتری." },
    ],
  }),
  component: EditClient,
});

function EditClient() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const client = useQuery({ queryKey: queryKeys.client(id), queryFn: () => getClient(id) });

  const save = useMutation({
    mutationFn: (input: Parameters<typeof updateClient>[1]) => updateClient(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      queryClient.invalidateQueries({ queryKey: queryKeys.client(id) });
      toast.success("تغییرات ذخیره شد");
      navigate({ to: "/clients/$id", params: { id } });
    },
    onError: (error) => toast.error(error.message || "ذخیره تغییرات ناموفق بود"),
  });

  return (
    <Screen>
      <TopBar title="ویرایش مشتری" back="/clients" />
      {client.isLoading ? (
        <div className="px-4 py-5">
          <LoadingState />
        </div>
      ) : client.isError || !client.data ? (
        <div className="px-4 py-5">
          <ErrorState text="این مشتری پیدا نشد." onRetry={() => client.refetch()} />
        </div>
      ) : (
        <ClientForm
          client={client.data}
          submitLabel="ذخیره تغییرات"
          pending={save.isPending}
          onSubmit={(input) => save.mutate(input)}
        />
      )}
    </Screen>
  );
}
