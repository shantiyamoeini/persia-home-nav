import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, MapPin, MessageSquare, Pencil, Phone, Plus, Trash2, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Chip, Screen, TopBar } from "@/components/app-shell";
import { CardSkeleton, StorageNote } from "@/components/data-state";
import { Field, SelectInput, TextInput } from "@/components/form-kit";
import {
  areaLine,
  budgetLine,
  channelLabels,
  dealLabels,
  formatDate,
  propertyTypeLabels,
  toFa,
  todayIso,
  type FollowUp,
} from "@/lib/data";
import { formatIranPhone } from "@/lib/phone";
import { useStore } from "@/lib/store";
import { useClientSource } from "@/lib/use-clients";


export const Route = createFileRoute("/clients/$clientId")({
  head: () => ({
    meta: [
      { title: "پرونده مشتری | دستیار املاک" },
      {
        name: "description",
        content: "نیازها، بودجه و تاریخچه کامل پیگیری‌های هر مشتری در یک صفحه.",
      },
      { property: "og:title", content: "پرونده مشتری" },
      { property: "og:description", content: "نیازها، بودجه و تاریخچه پیگیری‌های مشتری." },
    ],
  }),
  component: ClientDetail,
});

const channelIcon = { call: Phone, visit: MapPin, message: MessageSquare };

function ClientDetail() {
  const { clientId } = Route.useParams();
  const { followUps, addFollowUp, toggleFollowUp, removeFollowUp } = useStore();
  const { clients, loading, cloud, removeClient } = useClientSource();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const client = clients.find((c) => c.id === clientId);

  if (loading || !client) {
    return (
      <Screen>
        <TopBar title="پرونده مشتری" back="/clients" />
        <div className="space-y-4 p-4">
          {loading ? (
            <CardSkeleton count={2} />
          ) : (
            <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
              این مشتری حذف شده یا در دسترس نیست.
            </p>
          )}
        </div>
      </Screen>
    );
  }

  const history = followUps
    .filter((f) => f.clientId === client.id || f.clientName === client.name)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const onDelete = async () => {
    try {
      await removeClient(client.id);
      toast.success("مشتری حذف شد");
      navigate({ to: "/clients" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حذف مشتری انجام نشد.");
    }
  };


  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addFollowUp({
      clientId: client.id,
      clientName: client.name,
      subject: String(fd.get("subject") || "پیگیری"),
      date: String(fd.get("date") || todayIso),
      time: String(fd.get("time") || "۱۰:۰۰"),
      channel: String(fd.get("channel")) as FollowUp["channel"],
    });
    toast.success("پیگیری برای این مشتری ثبت شد");
    setOpen(false);
  };

  return (
    <Screen>
      <TopBar
        title={client.name}
        subtitle={`متقاضی ${dealLabels[client.interest]} · ثبت ${formatDate(client.createdAt)}`}
        back="/clients"
        action={
          <Link
            to="/clients/$clientId/edit"
            params={{ clientId: client.id }}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            <Pencil className="size-4" /> ویرایش
          </Link>
        }
      />

      <div className="space-y-4 p-4">
        <StorageNote cloud={cloud} />
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <a
            href={`tel:${client.phone}`}
            dir="ltr"
            className="flex items-center gap-2 text-sm font-bold text-primary"
          >
            <Phone className="size-4" />
            {client.phone ? formatIranPhone(client.phone) : "—"}
          </a>
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip>{propertyTypeLabels[client.type]}</Chip>
            {client.districts || client.district ? (
              <Chip>{client.districts || client.district}</Chip>
            ) : null}
            <Chip>{areaLine(client)}</Chip>
            {client.rooms > 0 ? <Chip>{toFa(client.rooms)} خواب</Chip> : null}
          </div>
          <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-xs font-bold text-foreground">
            <Wallet className="size-3.5 text-primary" />
            بودجه: {budgetLine(client)}
          </p>
          {client.requirements ? (
            <p className="mt-2 text-[11px] leading-5 text-foreground">
              نیازها: {client.requirements}
            </p>
          ) : null}

          {client.note ? (
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{client.note}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">تاریخچه پیگیری‌ها</h2>
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-bold text-secondary-foreground"
          >
            <Plus className="size-3.5" /> پیگیری جدید
          </button>
        </div>

        {open ? (
          <form
            onSubmit={onSubmit}
            className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
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
              className="h-11 w-full rounded-xl bg-primary text-xs font-extrabold text-primary-foreground"
            >
              ثبت پیگیری
            </button>
          </form>
        ) : null}

        {history.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
            برای این مشتری پیگیری‌ای ثبت نشده است.
          </p>
        ) : (
          <ul className="space-y-3">
            {history.map((f) => {
              const Icon = channelIcon[f.channel];
              return (
                <li key={f.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{f.subject}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Chip>{formatDate(f.date)}</Chip>
                        <Chip>ساعت {f.time}</Chip>
                        <Chip tone="primary">
                          <span className="inline-flex items-center gap-1">
                            <Icon className="size-3" />
                            {channelLabels[f.channel]}
                          </span>
                        </Chip>
                        {f.done ? <Chip tone="accent">انجام شد</Chip> : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      <button
                        onClick={() => toggleFollowUp(f.id)}
                        aria-label={f.done ? "بازگردانی" : "انجام شد"}
                        className={
                          f.done
                            ? "grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"
                            : "grid size-9 place-items-center rounded-full border border-border text-muted-foreground"
                        }
                      >
                        <CheckCircle2 className="size-4" />
                      </button>
                      <button
                        onClick={() => removeFollowUp(f.id)}
                        aria-label="حذف پیگیری"
                        className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {confirming ? (
          <div className="space-y-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
            <p className="text-xs font-bold text-destructive">
              حذف «{client.name}» قطعی است و بازگشتی ندارد. مطمئن هستید؟
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => void onDelete()}
                className="h-11 rounded-xl bg-destructive text-xs font-extrabold text-destructive-foreground"
              >
                بله، حذف کن
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="h-11 rounded-xl border border-border text-xs font-bold text-muted-foreground"
              >
                انصراف
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 text-sm font-bold text-destructive"
          >
            <Trash2 className="size-4" /> حذف این مشتری
          </button>
        )}
      </div>

    </Screen>
  );
}
