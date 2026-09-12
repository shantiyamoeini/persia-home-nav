import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { Screen, TopBar } from "@/components/app-shell";
import { CardSkeleton, ErrorNote, StorageNote } from "@/components/data-state";
import { PropertyCard } from "@/components/entity-cards";
import { propertyTypeLabels, toFa, type Deal, type PropertyType } from "@/lib/data";
import { usePropertySource } from "@/lib/use-properties";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/properties/")({
  head: () => ({
    meta: [
      { title: "فهرست املاک | دستیار املاک" },
      {
        name: "description",
        content: "جست‌وجو و فیلتر فایل‌های فروش و اجاره با جزئیات کامل هر ملک.",
      },
      { property: "og:title", content: "فهرست املاک" },
      { property: "og:description", content: "جست‌وجو و فیلتر فایل‌های فروش و اجاره." },
    ],
  }),
  component: PropertiesPage,
});

const dealTabs: { key: "all" | Deal; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "sale", label: "فروش" },
  { key: "rent", label: "اجاره" },
];

function PropertiesPage() {
  const { properties, loading, cloud, errorMessage } = usePropertySource();
  const [query, setQuery] = useState("");
  const [deal, setDeal] = useState<"all" | Deal>("all");
  const [type, setType] = useState<"all" | PropertyType>("all");
  const [showArchived, setShowArchived] = useState(false);

  const list = properties.filter((p) => {
    if (Boolean(p.archived) !== showArchived) return false;
    const matchQuery =
      !query ||
      [p.title, p.district, p.address, p.ownerName].some((v) => (v ?? "").includes(query));
    return matchQuery && (deal === "all" || p.deal === deal) && (type === "all" || p.type === type);
  });

  return (
    <Screen>
      <TopBar
        title="املاک"
        subtitle={loading ? "در حال بارگذاری..." : `${toFa(list.length)} فایل یافت شد`}
        action={
          <Link
            to="/properties/new"
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            <Plus className="size-4" /> ثبت ملک
          </Link>
        }
      />

      <div className="space-y-4 p-4">
        <StorageNote cloud={cloud} />

        <div className="relative">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جست‌وجوی عنوان، محله یا مالک..."
            className="h-11 w-full rounded-xl border border-border bg-card pr-9 pl-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-xl bg-secondary p-1">
          {dealTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setDeal(t.key)}
              className={cn(
                "rounded-lg py-2 text-xs font-bold transition-colors",
                deal === t.key ? "bg-card text-primary shadow-sm" : "text-muted-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", ...Object.keys(propertyTypeLabels)] as ("all" | PropertyType)[]).map((k) => (
            <button
              key={k}
              onClick={() => setType(k)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                type === k
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {k === "all" ? "همه نوع‌ها" : propertyTypeLabels[k]}
            </button>
          ))}
        </div>

        {cloud ? (
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="text-[11px] font-bold text-primary"
          >
            {showArchived ? "نمایش فایل‌های فعال" : "نمایش بایگانی"}
          </button>
        ) : null}

        {errorMessage ? <ErrorNote message={errorMessage} /> : null}

        {loading ? (
          <CardSkeleton />
        ) : list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
            {showArchived ? "فایل بایگانی‌شده‌ای ندارید." : "ملکی با این مشخصات پیدا نشد."}
          </p>
        ) : (
          <div className="space-y-3">
            {list.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}
