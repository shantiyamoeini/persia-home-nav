import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/app-shell";
import { ClientCard } from "@/components/entity-cards";
import { TextInput } from "@/components/form-kit";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { deleteClient, listClients, queryKeys } from "@/lib/api";
import { toFa } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/clients/")({
  head: () => ({
    meta: [
      { title: "مشتریان | دستیار مشاور املاک" },
      { name: "description", content: "فهرست مشتریان با بودجه، محله و نوع ملک مورد نظر." },
      { property: "og:title", content: "مشتریان" },
      { property: "og:description", content: "فهرست مشتریان با بودجه و نیاز آن‌ها." },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const [q, setQ] = useState("");
  const queryClient = useQueryClient();
  const clients = useQuery({ queryKey: queryKeys.clients, queryFn: listClients });

  const remove = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      queryClient.invalidateQueries({ queryKey: queryKeys.followUps });
      toast.success("مشتری حذف شد");
    },
    onError: () => toast.error("حذف مشتری ناموفق بود"),
  });

  const items = (clients.data ?? []).filter((c) =>
    `${c.name} ${c.phone} ${c.district}`.includes(q.trim()),
  );

  return (
    <Screen>
      <TopBar
        title="مشتریان"
        subtitle={`${toFa(items.length)} مشتری`}
        action={
          <Link
            to="/clients/new"
            aria-label="ثبت مشتری"
            className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"
          >
            <Plus className="size-4" />
          </Link>
        }
      />

      <div className="space-y-4 px-4 py-5">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <TextInput
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جست‌وجوی نام، شماره یا محله"
            className="pr-9"
          />
        </div>

        {clients.isLoading ? (
          <LoadingState />
        ) : clients.isError ? (
          <ErrorState onRetry={() => clients.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            text="مشتری‌ای پیدا نشد."
            action={
              <Link
                to="/clients/new"
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                ثبت مشتری جدید
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {items.map((c) => (
              <ClientCard
                key={c.id}
                client={c}
                onDelete={() => {
                  if (confirm(`«${c.name}» حذف شود؟`)) remove.mutate(c.id);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}
