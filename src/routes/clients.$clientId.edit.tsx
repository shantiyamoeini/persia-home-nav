import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/app-shell";
import { ClientForm } from "@/components/client-form";
import { LocalOnlyNote } from "@/components/local-note";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/clients/$clientId/edit")({
  head: () => ({
    meta: [
      { title: "ویرایش مشتری | دستیار املاک" },
      {
        name: "description",
        content: "ویرایش نیازها، بودجه و مشخصات تماس مشتری ذخیره‌شده روی همین دستگاه.",
      },
      { property: "og:title", content: "ویرایش مشتری" },
      { property: "og:description", content: "ویرایش نیازها و بودجه مشتری." },
    ],
  }),
  component: EditClient,
});

function EditClient() {
  const { clientId } = Route.useParams();
  const { clients, updateClient, ready } = useStore();
  const navigate = useNavigate();
  const client = clients.find((c) => c.id === clientId);

  if (!client) {
    return (
      <Screen>
        <TopBar title="ویرایش مشتری" back="/clients" />
        <div className="p-4">
          <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
            {ready ? "این مشتری روی این دستگاه پیدا نشد." : "در حال بارگذاری..."}
          </p>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="ویرایش مشتری" subtitle={client.name} back="/clients" />
      <div className="px-4 pt-4">
        <LocalOnlyNote />
      </div>
      <ClientForm
        initial={client}
        submitLabel="ذخیره تغییرات"
        onSubmit={(draft) => {
          updateClient(client.id, draft);
          toast.success("تغییرات ذخیره شد");
          navigate({ to: "/clients/$clientId", params: { clientId: client.id } });
        }}
      />
    </Screen>
  );
}
