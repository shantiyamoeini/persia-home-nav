import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-foreground">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

const base =
  "w-full rounded-xl border border-border bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(base, "h-11", props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(base, "min-h-24 py-2.5", props.className)} />;
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(base, "h-11 appearance-none", props.className)} />;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div
      className="grid gap-2 rounded-xl bg-secondary p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg py-2 text-xs font-bold transition-colors",
            value === o.value ? "bg-card text-primary shadow-sm" : "text-muted-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SubmitBar({ label, pending }: { label: string; pending?: boolean }) {
  return (
    <div className="sticky bottom-24 pt-2">
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-2xl bg-primary text-sm font-extrabold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? "در حال ذخیره..." : label}
      </button>
    </div>
  );
}
