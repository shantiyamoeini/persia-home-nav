import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/app-shell";
import { ClientForm } from "@/components/client-form";
import { StorageNote } from "@/components/data-state";
import { useClientSource } from "@/lib/use-clients";

export const Route = createFileRoute("/clients/new")({
  head: () => ({
    meta: [
      { title: "ثبت مشتری جدید | دستیار املاک" },
      {
        name: "description",
        content: "فرم ثبت مشتری با نوع درخواست، بازه بودجه، محله‌های مورد نظر و نیازها.",
      },
      { property: "og:title", content: "ثبت مشتری جدید" },
      { property: "og:description", content: "فرم ثبت مشتری با بودجه و نیازها." },
    ],
  }),
  component: AddClient,
});

function AddClient() {
  const { addClient, cloud, saving } = useClientSource();
  const navigate = useNavigate();

  return (
    <Screen>
      <TopBar title="ثبت مشتری جدید" subtitle="نیاز مشتری را دقیق ثبت کنید" back="/clients" />
      <div className="px-4 pt-4">
        <StorageNote cloud={cloud} />
      </div>
      <ClientForm
        submitLabel="ثبت مشتری"
        pending={saving}
        onSubmit={(draft) => {
          void (async () => {
            try {
              const id = await addClient(draft);
              toast.success(cloud ? "مشتری ذخیره شد" : "مشتری روی همین دستگاه ذخیره شد");
              navigate({ to: "/clients/$clientId", params: { clientId: id } });
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "ثبت مشتری انجام نشد.");
            }
          })();
        }}
      />
    </Screen>
  );
}
