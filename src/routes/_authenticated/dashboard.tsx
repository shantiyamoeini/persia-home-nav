import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, Check, LogOut, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Chip, Screen, SectionTitle, TopBar } from "@/components/app-shell";
import { ClientCard, PropertyCard } from "@/components/entity-cards";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { supabase } from "@/integrations/supabase/client";
import {
  listClients,
  listFollowUps,
  listProperties,
  queryKeys,
  updateFollowUp,
} from "@/lib/api";
import { channelLabels, formatDate, todayIso, toFa } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "میزکار | دستیار مشاور املاک" },
      {
        name: "description",
        content: "پیگیری‌های امروز، آخرین فایل‌های ملک و مشتریان تازه در یک نگاه.",
      },
      { property: "og:title", content: "میزکار مشاور املاک" },
      { property: "og:description", content: "پیگیری‌های امروز و آخرین فایل‌ها." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const properties = useQuery({ queryKey: queryKeys.properties, queryFn: listProperties });
  const clients = useQuery({ queryKey: queryKeys.clients, queryFn: listClients });
  const followUps = useQuery({ queryKey: queryKeys.followUps, queryFn: listFollowUps });

  const complete = useMutation({
    mutationFn: (id: string) => updateFollowUp(id, { done: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.followUps });
      toast.success("پیگیری انجام شد");
    },
    onError: () => toast.error("ثبت انجام‌شدن پیگیری ناموفق بود"),
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const today = (followUps.data ?? []).filter((f) => !f.done && f.due_date <= todayIso);

  return (
    <Screen>
      <TopBar
        title="میزکار"
        subtitle="خلاصه کارهای امروز شما"
        action={
          <button
            onClick={signOut}
            aria-label="خروج از حساب"
            className="grid size-9 place-items-center rounded-full bg-secondary text-secondary-foreground"
          >
            <LogOut className="size-4" />
          </button>
        }
      />

      <div className="space-y-6 px-4 py-5">
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/properties/new"
            className="flex items-center gap-2 rounded-2xl bg-primary p-4 text-xs font-bold text-primary-foreground"
          >
            <Building2 className="size-4" /> ثبت ملک جدید
          </Link>
          <Link
            to="/clients/new"
            className="flex items-center gap-2 rounded-2xl bg-accent p-4 text-xs font-bold text-accent-foreground"
          >
            <UserPlus className="size-4" /> ثبت مشتری جدید
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "املاک", value: properties.data?.length ?? 0 },
            { label: "مشتریان", value: clients.data?.length ?? 0 },
            { label: "پیگیری امروز", value: today.length },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-card p-3 text-center">
              <p className="text-lg font-extrabold text-primary">{toFa(item.value)}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        <section>
          <SectionTitle title="پیگیری‌های امروز" actionLabel="همه پیگیری‌ها" to="/followups" />
          {followUps.isLoading ? (
            <LoadingState />
          ) : followUps.isError ? (
            <ErrorState onRetry={() => followUps.refetch()} />
          ) : today.length === 0 ? (
            <EmptyState text="برای امروز پیگیری باز ندارید." />
          ) : (
            <ul className="space-y-3">
              {today.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{f.subject}</p>
                    <p className="mt-1 truncate text-[11px] text-muted-foreground">
                      {f.client_name} · {channelLabels[f.channel]} · {formatDate(f.due_date)}{" "}
                      ساعت {toFa(f.due_time.slice(0, 5))}
                    </p>
                  </div>
                  <button
                    onClick={() => complete.mutate(f.id)}
                    aria-label="انجام شد"
                    className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"
                  >
                    <Check className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <SectionTitle title="آخرین املاک" actionLabel="همه املاک" to="/properties" />
          {properties.isLoading ? (
            <LoadingState />
          ) : properties.isError ? (
            <ErrorState onRetry={() => properties.refetch()} />
          ) : properties.data?.length === 0 ? (
            <EmptyState
              text="هنوز فایلی ثبت نکرده‌اید."
              action={
                <Link
                  to="/properties/new"
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
                >
                  ثبت اولین ملک
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {properties.data?.slice(0, 2).map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionTitle title="مشتریان تازه" actionLabel="همه مشتریان" to="/clients" />
          {clients.isLoading ? (
            <LoadingState />
          ) : clients.isError ? (
            <ErrorState onRetry={() => clients.refetch()} />
          ) : clients.data?.length === 0 ? (
            <EmptyState text="هنوز مشتری ثبت نشده است." />
          ) : (
            <div className="space-y-3">
              {clients.data?.slice(0, 2).map((c) => (
                <ClientCard key={c.id} client={c} />
              ))}
            </div>
          )}
        </section>

        <p className="pb-2 text-center text-[11px] text-muted-foreground">
          <Chip>اطلاعات شما خصوصی است</Chip>
        </p>
      </div>
    </Screen>
  );
}
