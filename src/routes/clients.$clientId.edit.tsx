import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/app-shell";
import { ClientForm } from "@/components/client-form";
import { CardSkeleton, ErrorNote, StorageNote } from "@/components/data-state";
import { useClientSource } from "@/lib/use-clients";

export const Route = createFileRoute("/clients/$clientId/edit")({
  head: () => ({
    meta: [
      { title: "ویرایش مشتری | دستیار املاک" },
      {
        name: "description",
        content: "ویرایش نیازها، بازه بودجه و مشخصات تماس مشتری در پرونده دفتر املاک.",
      },
      { property: "og:title", content: "ویرایش مشتری" },
      { property: "og:description", content: "ویرایش نیازها و بودجه مشتری." },
    ],
  }),
  component: EditClient,
});

function EditClient() {
  const { clientId } = Route.useParams();
  const { clients, updateClient, loading, cloud, saving, errorMessage } = useClientSource();
  const navigate = useNavigate();
  const client = clients.find((c) => c.id === clientId);

  if (loading || !client) {
    return (
      <Screen>
        <TopBar title="ویرایش مشتری" back="/clients" />
        <div className="space-y-4 p-4">
          {errorMessage ? <ErrorNote message={errorMessage} /> : null}
          {loading ? (
            <CardSkeleton count={2} />
          ) : (
            <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
              این مشتری پیدا نشد.
            </p>
          )}
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="ویرایش مشتری" subtitle={client.name} back="/clients" />
      <div className="px-4 pt-4">
        <StorageNote cloud={cloud} />
      </div>
      <ClientForm
        initial={client}
        submitLabel="ذخیره تغییرات"
        pending={saving}
        onSubmit={(draft) => {
          void (async () => {
            try {
              await updateClient(client.id, draft);
              toast.success("تغییرات ذخیره شد");
              navigate({ to: "/clients/$clientId", params: { clientId: client.id } });
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "ذخیره تغییرات انجام نشد.");
            }
          })();
        }}
      />
    </Screen>
  );
}
