import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, MessageSquare, Phone, Plus, RotateCcw, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Chip, Screen, TopBar } from "@/components/app-shell";
import { Field, SelectInput, TextInput } from "@/components/form-kit";
import { channelLabels, formatDate, todayIso, toFa, type FollowUp } from "@/lib/data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/followups")({
  head: () => ({
    meta: [
      { title: "پیگیری‌ها | دستیار املاک" },
      {
        name: "description",
        content: "پیگیری‌های امروز، روزهای آینده و انجام‌شده‌ها را ببینید و تیک بزنید.",
      },
      { property: "og:title", content: "پیگیری‌ها" },
      { property: "og:description", content: "پیگیری‌های امروز، آینده و انجام‌شده." },
    ],
  }),
  component: FollowUpsPage,
});

type Tab = "today" | "upcoming" | "done";

const tabs: { key: Tab; label: string }[] = [
  { key: "today", label: "امروز" },
  { key: "upcoming", label: "روزهای آینده" },
  { key: "done", label: "انجام‌شده" },
];

const channelIcon = {
  call: Phone,
  visit: MapPin,
  message: MessageSquare,
};

function FollowUpsPage() {
  const { followUps, clients, toggleFollowUp, addFollowUp } = useStore();
  const [tab, setTab] = useState<Tab>("today");
  const [open, setOpen] = useState(false);

  const list = followUps.filter((f) => {
    if (tab === "done") return f.done;
    if (f.done) return false;
    return tab === "today" ? f.date === todayIso : f.date > todayIso;
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addFollowUp({
      clientName: String(fd.get("clientName")),
      subject: String(fd.get("subject") || "پیگیری"),
      date: String(fd.get("date") || todayIso),
      time: String(fd.get("time") || "۱۰:۰۰"),
      channel: String(fd.get("channel")) as FollowUp["channel"],
    });
    toast.success("پیگیری جدید ثبت شد");
    setOpen(false);
  };

  return (
    <Screen>
      <TopBar
        title="پیگیری‌ها"
        subtitle={`${toFa(list.length)} مورد در این بخش`}
        action={
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            <Plus className="size-4" /> پیگیری جدید
          </button>
        }
      />

      <div className="space-y-4 p-4">
        {open ? (
          <form
            onSubmit={onSubmit}
            className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <Field label="مشتری">
              <SelectInput name="clientName" defaultValue={clients[0]?.name}>
                {clients.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="موضوع">
              <TextInput name="subject" required placeholder="هماهنگی بازدید..." />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="تاریخ">
                <TextInput name="date" type="date" defaultValue={todayIso} />
              </Field>
              <Field label="ساعت">
                <TextInput name="time" placeholder="۱۰:۳۰" />
              </Field>
            </div>
            <Field label="روش پیگیری">
              <SelectInput name="channel" defaultValue="call">
                {Object.entries(channelLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <button
              type="submit"
              className="h-11 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground"
            >
              ثبت پیگیری
            </button>
          </form>
        ) : null}

        <div className="grid grid-cols-3 gap-2 rounded-xl bg-secondary p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-lg py-2 text-xs font-bold transition-colors",
                tab === t.key ? "bg-card text-primary shadow-sm" : "text-muted-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
            موردی در این بخش وجود ندارد.
          </p>
        ) : (
          <ul className="space-y-3">
            {list.map((f) => {
              const Icon = channelIcon[f.channel];
              return (
                <li
                  key={f.id}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "truncate text-sm font-bold text-foreground",
                          f.done && "line-through opacity-60",
                        )}
                      >
                        {f.clientName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{f.subject}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Chip>{formatDate(f.date)}</Chip>
                        <Chip>ساعت {f.time}</Chip>
                        <Chip tone="primary">
                          <span className="inline-flex items-center gap-1">
                            <Icon className="size-3" />
                            {channelLabels[f.channel]}
                          </span>
                        </Chip>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFollowUp(f.id)}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-[11px] font-bold transition-colors",
                        f.done
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary text-primary-foreground",
                      )}
                    >
                      {f.done ? (
                        <>
                          <RotateCcw className="size-3.5" /> بازگردانی
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-3.5" /> انجام شد
                        </>
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Screen>
  );
}
