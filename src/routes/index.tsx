import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, CalendarCheck, CheckCircle2, Clock, Plus, UserPlus, Users } from "lucide-react";
import { Chip, Screen, SectionTitle, TopBar } from "@/components/app-shell";
import { ClientCard, PropertyCard } from "@/components/entity-cards";
import { channelLabels, dealLabels, todayIso, toFa } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "میزکار مشاور املاک | دستیار املاک" },
      {
        name: "description",
        content: "خلاصه پیگیری‌های امروز، آخرین املاک ثبت‌شده و مشتریان جدید در یک نگاه.",
      },
      { property: "og:title", content: "میزکار مشاور املاک" },
      {
        property: "og:description",
        content: "پیگیری‌های امروز، املاک و مشتریان جدید در یک نگاه.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { properties, clients, followUps, toggleFollowUp } = useStore();
  const todays = followUps.filter((f) => f.date === todayIso);
  const openToday = todays.filter((f) => !f.done);

  return (
    <Screen>
      <TopBar title="سلام، جناب مشاور 👋" subtitle="خلاصه کارهای امروز شما" />

      <div className="space-y-6 p-4">
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<Clock className="size-4" />} value={openToday.length} label="پیگیری امروز" />
          <StatCard icon={<Building2 className="size-4" />} value={properties.length} label="فایل ملک" />
          <StatCard icon={<Users className="size-4" />} value={clients.length} label="مشتری" />
        </div>

        <section>
          <SectionTitle title="افزودن سریع" />
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/properties/new"
              className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm"
            >
              <Plus className="size-4" /> ثبت ملک
            </Link>
            <Link
              to="/clients/new"
              className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground shadow-sm"
            >
              <UserPlus className="size-4 text-primary" /> ثبت مشتری
            </Link>
          </div>
        </section>

        <section>
          <SectionTitle title="پیگیری‌های امروز" actionLabel="همه پیگیری‌ها" to="/followups" />
          {todays.length === 0 ? (
            <EmptyState text="برای امروز پیگیری‌ای ثبت نشده است." />
          ) : (
            <ul className="space-y-3">
              {todays.map((f) => (
                <li
                  key={f.id}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{f.clientName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{f.subject}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Chip>ساعت {f.time}</Chip>
                        <Chip tone="primary">{channelLabels[f.channel]}</Chip>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFollowUp(f.id)}
                      className={
                        f.done
                          ? "grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
                          : "grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground"
                      }
                      aria-label={f.done ? "بازگردانی" : "انجام شد"}
                    >
                      <CheckCircle2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <SectionTitle title="آخرین املاک" actionLabel="مشاهده همه" to="/properties" />
          <div className="space-y-3">
            {properties.slice(0, 2).map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>

        <section>
          <SectionTitle title="مشتریان جدید" actionLabel="مشاهده همه" to="/clients" />
          <div className="space-y-3">
            {clients.slice(0, 2).map((c) => (
              <ClientCard key={c.id} client={c} />
            ))}
          </div>
        </section>

        <p className="pb-2 text-center text-[11px] text-muted-foreground">
          <CalendarCheck className="mb-0.5 ml-1 inline size-3" />
          {toFa(openToday.length)} پیگیری باز برای امروز · {dealLabels.sale} و {dealLabels.rent}
        </p>
      </div>
    </Screen>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center shadow-sm">
      <span className="mx-auto grid size-8 place-items-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <p className="mt-2 text-lg font-extrabold text-foreground">{toFa(value)}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
      {text}
    </div>
  );
}
