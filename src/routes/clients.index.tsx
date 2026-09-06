import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, UserPlus } from "lucide-react";
import { useState } from "react";
import { Screen, TopBar } from "@/components/app-shell";
import { ClientCard } from "@/components/entity-cards";
import { dealLabels, toFa, type Deal } from "@/lib/data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/clients/")({
  head: () => ({
    meta: [
      { title: "مشتریان | دستیار املاک" },
      {
        name: "description",
        content: "فهرست متقاضیان خرید و اجاره همراه با بودجه، محله و نیازهای هر مشتری.",
      },
      { property: "og:title", content: "مشتریان" },
      { property: "og:description", content: "فهرست متقاضیان خرید و اجاره با جزئیات." },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const { clients } = useStore();
  const [query, setQuery] = useState("");
  const [interest, setInterest] = useState<"all" | Deal>("all");

  const list = clients.filter(
    (c) =>
      (!query || [c.name, c.phone, c.district].some((v) => v.includes(query))) &&
      (interest === "all" || c.interest === interest),
  );

  return (
    <Screen>
      <TopBar
        title="مشتریان"
        subtitle={`${toFa(list.length)} مشتری`}
        action={
          <Link
            to="/clients/new"
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            <UserPlus className="size-4" /> ثبت مشتری
          </Link>
        }
      />

      <div className="space-y-4 p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جست‌وجوی نام، شماره یا محله..."
            className="h-11 w-full rounded-xl border border-border bg-card pr-9 pl-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-xl bg-secondary p-1">
          {(["all", "sale", "rent"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setInterest(k)}
              className={cn(
                "rounded-lg py-2 text-xs font-bold transition-colors",
                interest === k ? "bg-card text-primary shadow-sm" : "text-muted-foreground",
              )}
            >
              {k === "all" ? "همه" : `متقاضی ${dealLabels[k]}`}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
            مشتری‌ای با این مشخصات پیدا نشد.
          </p>
        ) : (
          <div className="space-y-3">
            {list.map((c) => (
              <ClientCard key={c.id} client={c} />
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}
