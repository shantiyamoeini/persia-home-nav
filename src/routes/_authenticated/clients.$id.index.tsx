import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Phone, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Chip, Screen, SectionTitle, TopBar } from "@/components/app-shell";
import { FollowUpForm } from "@/components/followup-form";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import {
  deleteFollowUp,
  getClient,
  listClientFollowUps,
  queryKeys,
  updateFollowUp,
} from "@/lib/api";
import {
  channelLabels,
  dealLabels,
  formatDate,
  formatPrice,
  propertyTypeLabels,
  toFa,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/clients/$id/")({
  head: () => ({
    meta: [
      { title: "پرونده مشتری | دستیار مشاور املاک" },
      { name: "description", content: "مشخصات مشتری و تاریخچه کامل پیگیری‌های او." },
      { property: "og:title", content: "پرونده مشتری" },
      { property: "og:description", content: "مشخصات مشتری و تاریخچه پیگیری‌ها." },
    ],
  }),
  component: ClientDetail,
});

function ClientDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const client = useQuery({ queryKey: queryKeys.client(id), queryFn: () => getClient(id) });
  const followUps = useQuery({
    queryKey: queryKeys.clientFollowUps(id),
    queryFn: () => listClientFollowUps(id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.clientFollowUps(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.followUps });
  };

  const toggle = useMutation({
    mutationFn: ({ fid, done }: { fid: string; done: boolean }) => updateFollowUp(fid, { done }),
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

  if (client.isLoading) {
    return (
      <Screen>
        <TopBar title="پرونده مشتری" back="/clients" />
        <div className="px-4 py-5">
          <LoadingState />
        </div>
      </Screen>
    );
  }

  if (client.isError || !client.data) {
    return (
      <Screen>
        <TopBar title="پرونده مشتری" back="/clients" />
        <div className="px-4 py-5">
          <ErrorState text="این مشتری پیدا نشد." onRetry={() => client.refetch()} />
        </div>
      </Screen>
    );
  }

  const c = client.data;

  return (
    <Screen>
      <TopBar
        title={c.name}
        subtitle={`متقاضی ${dealLabels[c.interest]} ${propertyTypeLabels[c.type]}`}
        back="/clients"
        action={
          <Link
            to="/clients/$id/edit"
            params={{ id }}
            className="rounded-full bg-secondary px-3 py-2 text-[11px] font-bold text-secondary-foreground"
          >
            ویرایش
          </Link>
        }
      />

      <div className="space-y-6 px-4 py-5">
        <section className="rounded-2xl border border-border bg-card p-4">
          <a
            href={`tel:${c.phone}`}
            dir="ltr"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 py-2.5 text-sm font-bold text-primary"
          >
            <Phone className="size-4" /> {c.phone || "—"}
          </a>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip tone="primary">بودجه {formatPrice(c.budget)}</Chip>
            {c.district ? <Chip>{c.district}</Chip> : null}
            {c.min_area > 0 ? <Chip>حداقل {toFa(c.min_area)} متر</Chip> : null}
            {c.rooms > 0 ? <Chip>{toFa(c.rooms)} خواب</Chip> : null}
          </div>
          {c.note ? (
            <p className="mt-3 border-t border-border pt-3 text-[11px] leading-5 text-muted-foreground">
              {c.note}
            </p>
          ) : null}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle title="تاریخچه پیگیری‌ها" />
            <button
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground"
            >
              <Plus className="size-3.5" /> پیگیری جدید
            </button>
          </div>

          {showForm ? (
            <div className="mb-3">
              <FollowUpForm clients={[]} fixedClient={c} onDone={() => setShowForm(false)} />
            </div>
          ) : null}

          {followUps.isLoading ? (
            <LoadingState />
          ) : followUps.isError ? (
            <ErrorState onRetry={() => followUps.refetch()} />
          ) : (followUps.data ?? []).length === 0 ? (
            <EmptyState text="برای این مشتری پیگیری‌ای ثبت نشده است." />
          ) : (
            <ul className="space-y-3">
              {followUps.data?.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{f.subject}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDate(f.due_date)} ساعت {toFa(f.due_time.slice(0, 5))} ·{" "}
                      {channelLabels[f.channel]}
                    </p>
                    <span className="mt-2 inline-block">
                      <Chip tone={f.done ? "primary" : "accent"}>
                        {f.done ? "انجام شد" : "در انتظار"}
                      </Chip>
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      onClick={() => toggle.mutate({ fid: f.id, done: !f.done })}
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
        </section>
      </div>
    </Screen>
  );
}
