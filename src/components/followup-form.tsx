import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Field, SelectInput, TextInput } from "./form-kit";
import { createFollowUp, queryKeys } from "@/lib/api";
import { channelLabels, todayIso, type Channel, type Client } from "@/lib/data";

export function FollowUpForm({
  clients,
  fixedClient,
  onDone,
}: {
  clients: Client[];
  fixedClient?: Client;
  onDone?: () => void;
}) {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState("");
  const [clientId, setClientId] = useState(fixedClient?.id ?? clients[0]?.id ?? "");
  const [dueDate, setDueDate] = useState(todayIso);
  const [dueTime, setDueTime] = useState("10:00");
  const [channel, setChannel] = useState<Channel>("call");

  const create = useMutation({
    mutationFn: createFollowUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.followUps });
      toast.success("پیگیری ثبت شد");
      setSubject("");
      onDone?.();
    },
    onError: (error) => toast.error(error.message || "ثبت پیگیری ناموفق بود"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error("موضوع پیگیری را وارد کنید");
      return;
    }
    const client = fixedClient ?? clients.find((c) => c.id === clientId);
    create.mutate({
      client_id: client?.id ?? null,
      client_name: client?.name ?? "بدون مشتری",
      subject,
      due_date: dueDate,
      due_time: dueTime,
      channel,
      done: false,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <Field label="موضوع پیگیری">
        <TextInput
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="مثلاً هماهنگی بازدید ملک"
        />
      </Field>

      {fixedClient ? null : (
        <Field label="مشتری">
          <SelectInput value={clientId} onChange={(e) => setClientId(e.target.value)}>
            {clients.length === 0 ? <option value="">بدون مشتری</option> : null}
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </SelectInput>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="تاریخ">
          <TextInput
            dir="ltr"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </Field>
        <Field label="ساعت">
          <TextInput
            dir="ltr"
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
          />
        </Field>
      </div>

      <Field label="روش پیگیری">
        <SelectInput value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
          {Object.entries(channelLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectInput>
      </Field>

      <button
        type="submit"
        disabled={create.isPending}
        className="h-11 w-full rounded-xl bg-primary text-xs font-extrabold text-primary-foreground disabled:opacity-60"
      >
        {create.isPending ? "در حال ذخیره..." : "ثبت پیگیری"}
      </button>
    </form>
  );
}
