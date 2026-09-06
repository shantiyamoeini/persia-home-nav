import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Screen, TopBar } from "@/components/app-shell";
import { PropertyCard } from "@/components/entity-cards";
import { SegmentedControl, TextInput } from "@/components/form-kit";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { deleteProperty, listProperties, queryKeys } from "@/lib/api";
import { toFa } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/properties/")({
  head: () => ({
    meta: [
      { title: "فهرست املاک | دستیار مشاور املاک" },
      { name: "description", content: "جست‌وجو و مدیریت فایل‌های فروش و اجاره." },
      { property: "og:title", content: "فهرست املاک" },
      { property: "og:description", content: "جست‌وجو و مدیریت فایل‌های فروش و اجاره." },
    ],
  }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const [q, setQ] = useState("");
  const [deal, setDeal] = useState<"all" | "sale" | "rent">("all");
  const queryClient = useQueryClient();
  const properties = useQuery({ queryKey: queryKeys.properties, queryFn: listProperties });

  const remove = useMutation({
    mutationFn: deleteProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.properties });
      toast.success("ملک حذف شد");
    },
    onError: () => toast.error("حذف ملک ناموفق بود"),
  });

  const items = (properties.data ?? []).filter((p) => {
    const matchDeal = deal === "all" || p.deal === deal;
    const text = `${p.title} ${p.district} ${p.address} ${p.owner_name}`;
    return matchDeal && text.includes(q.trim());
  });

  return (
    <Screen>
      <TopBar
        title="املاک"
        subtitle={`${toFa(items.length)} فایل`}
        action={
          <Link
            to="/properties/new"
            aria-label="ثبت ملک"
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
            placeholder="جست‌وجو در عنوان، محله یا مالک"
            className="pr-9"
          />
        </div>

        <SegmentedControl<"all" | "sale" | "rent">
          value={deal}
          onChange={setDeal}
          options={[
            { value: "all", label: "همه" },
            { value: "sale", label: "فروش" },
            { value: "rent", label: "اجاره" },
          ]}
        />

        {properties.isLoading ? (
          <LoadingState />
        ) : properties.isError ? (
          <ErrorState onRetry={() => properties.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            text="ملکی با این مشخصات پیدا نشد."
            action={
              <Link
                to="/properties/new"
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                ثبت ملک جدید
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {items.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                onDelete={() => {
                  if (confirm(`«${p.title}» حذف شود؟`)) remove.mutate(p.id);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}
