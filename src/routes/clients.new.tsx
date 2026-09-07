import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/app-shell";
import { ClientForm } from "@/components/client-form";
import { LocalOnlyNote } from "@/components/local-note";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/clients/new")({
  head: () => ({
    meta: [
      { title: "ثبت مشتری جدید | دستیار املاک" },
      {
        name: "description",
        content: "فرم ثبت مشتری با نوع درخواست، بودجه، محله مورد نظر و توضیحات.",
      },
      { property: "og:title", content: "ثبت مشتری جدید" },
      { property: "og:description", content: "فرم ثبت مشتری با بودجه و نیازها." },
    ],
  }),
  component: AddClient,
});

function AddClient() {
  const { addClient } = useStore();
  const navigate = useNavigate();

  return (
    <Screen>
      <TopBar title="ثبت مشتری جدید" subtitle="نیاز مشتری را دقیق ثبت کنید" back="/clients" />
      <div className="px-4 pt-4">
        <LocalOnlyNote />
      </div>
      <ClientForm
        submitLabel="ثبت مشتری"
        onSubmit={(draft) => {
          const id = addClient(draft);
          toast.success("مشتری روی همین دستگاه ذخیره شد");
          navigate({ to: "/clients/$clientId", params: { clientId: id } });
        }}
      />
    </Screen>
  );
}
