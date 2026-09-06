import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Chip, Screen, SegmentedNav, TopBar } from "@/components/app-shell";
import { FollowUpForm } from "@/components/followup-form";
import { SegmentedControl } from "@/components/form-kit";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import {
  deleteFollowUp,
  listClients,
  listFollowUps,
  queryKeys,
  updateFollowUp,
} from "@/lib/api";
import { channelLabels, formatDate, toFa, todayIso } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/followups")({
  head: () => ({
    meta: [
      { title: "پیگیری‌ها | دستیار مشاور املاک" },
      { name: "description", content: "پیگیری‌های امروز، آینده و انجام‌شده مشاور املاک." },
      { property: "og:title", content: "پیگیری‌ها" },
      { property: "og:description", content: "پیگیری‌های امروز، آینده و انجام‌شده." },
    ],
  }),
  component: FollowUpsPage,
});

type Tab = "today" | "upcoming" | "done";

function FollowUpsPage() {
  const [tab, setTab] = useState<Tab>("today");
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const followUps = useQuery({ queryKey: queryKeys.followUps, queryFn: listFollowUps });
  const clients = useQuery({ queryKey: queryKeys.clients, queryFn: listClients });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.followUps });

  const toggle = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) => updateFollowUp(id, { done }),
    onSuccess: invalidate,
    onError: () => toast.error("به‌روزرسانی پیگیری ناموفق بود"),
  });

  const remove = useMutation({
    mutationFn: deleteFollowUp,
    onSuccess: () => {
      invalidate();
      toast.success("پیگیری حذف شد");
    },
    onError: () => toast.error("حذف پیگیری ناموفق بود"),
  });

  const all = followUps.data ?? [];
  const items = all.filter((f) => {
    if (tab === "done") return f.done;
    if (tab === "today") return !f.done && f.due_date <= todayIso;
    return !f.done && f.due_date > todayIso;
  });

  return (
    <Screen>
      <TopBar
        title="پیگیری‌ها"
        subtitle={`${toFa(all.filter((f) => !f.done).length)} پیگیری باز`}
        action={
          <button
            onClick={() => setShowForm((v) => !v)}
            aria-label="ثبت پیگیری"
            className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"
          >
            <Plus className="size-4" />
          </button>
        }
      />

      <div className="space-y-4 px-4 py-5">
        {showForm ? (
          <FollowUpForm clients={clients.data ?? []} onDone={() => setShowForm(false)} />
        ) : null}

        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "today", label: "امروز" },
            { value: "upcoming", label: "آینده" },
            { value: "done", label: "انجام‌شده" },
          ]}
        />

        {followUps.isLoading ? (
          <LoadingState />
        ) : followUps.isError ? (
          <ErrorState onRetry={() => followUps.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState text="در این بخش پیگیری‌ای وجود ندارد." />
        ) : (
          <ul className="space-y-3">
            {items.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{f.subject}</p>
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    {f.client_id ? (
                      <Link to="/clients/$id" params={{ id: f.client_id }} className="text-primary">
                        {f.client_name}
                      </Link>
                    ) : (
                      f.client_name
                    )}{" "}
                    · {channelLabels[f.channel]}
                  </p>
                  <span className="mt-2 inline-block">
                    <Chip tone={f.done ? "primary" : "accent"}>
                      {formatDate(f.due_date)} ساعت {toFa(f.due_time.slice(0, 5))}
                    </Chip>
                  </span>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    onClick={() => toggle.mutate({ id: f.id, done: !f.done })}
                    aria-label={f.done ? "بازگشت به در انتظار" : "انجام شد"}
                    className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    onClick={() => remove.mutate(f.id)}
                    aria-label="حذف پیگیری"
                    className="grid size-9 place-items-center rounded-full bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Screen>
  );
}
