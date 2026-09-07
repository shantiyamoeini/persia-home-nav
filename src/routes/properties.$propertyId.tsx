import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bed, MapPin, Maximize, Pencil, Phone, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { Chip, Screen, TopBar } from "@/components/app-shell";
import { LocalOnlyNote } from "@/components/local-note";
import { priceLine, propertyTypeLabels, dealLabels, toFa, formatDate } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/properties/$propertyId")({
  head: () => ({
    meta: [
      { title: "جزئیات ملک | دستیار املاک" },
      {
        name: "description",
        content: "مشخصات کامل فایل ملک، عکس‌ها، قیمت، امکانات و اطلاعات مالک با امکان ویرایش و حذف.",
      },
      { property: "og:title", content: "جزئیات ملک" },
      { property: "og:description", content: "مشخصات کامل فایل ملک با امکان ویرایش و حذف." },
    ],
  }),
  component: PropertyDetail,
});

function PropertyDetail() {
  const { propertyId } = Route.useParams();
  const { properties, removeProperty, ready } = useStore();
  const navigate = useNavigate();
  const property = properties.find((p) => p.id === propertyId);

  if (!property) {
    return (
      <Screen>
        <TopBar title="ملک یافت نشد" back="/properties" />
        <div className="p-4">
          <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
            {ready ? "این فایل حذف شده یا روی این دستگاه ذخیره نشده است." : "در حال بارگذاری..."}
          </p>
        </div>
      </Screen>
    );
  }

  const onDelete = () => {
    if (!window.confirm("این فایل ملک از این دستگاه حذف شود؟")) return;
    removeProperty(property.id);
    toast.success("فایل ملک حذف شد");
    navigate({ to: "/properties" });
  };

  return (
    <Screen>
      <TopBar
        title={property.title}
        subtitle={`ثبت‌شده در ${formatDate(property.createdAt)}`}
        back="/properties"
        action={
          <Link
            to="/properties/$propertyId/edit"
            params={{ propertyId: property.id }}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            <Pencil className="size-4" /> ویرایش
          </Link>
        }
      />

      <div className="space-y-4 p-4">
        {property.photos.length > 0 ? (
          <div className="flex snap-x gap-2 overflow-x-auto pb-1">
            {property.photos.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`عکس ${toFa(i + 1)} ${property.title}`}
                className="h-44 w-64 shrink-0 snap-start rounded-2xl border border-border object-cover"
              />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-xs text-muted-foreground">
            برای این ملک عکسی ثبت نشده است.
          </p>
        )}

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <Chip tone={property.deal === "sale" ? "primary" : "accent"}>
              {dealLabels[property.deal]}
            </Chip>
            <Chip>{propertyTypeLabels[property.type]}</Chip>
            <Chip>
              <span className="inline-flex items-center gap-1">
                <Maximize className="size-3" />
                {toFa(property.area)} متر
              </span>
            </Chip>
            {property.rooms > 0 ? (
              <Chip>
                <span className="inline-flex items-center gap-1">
                  <Bed className="size-3" />
                  {toFa(property.rooms)} خواب
                </span>
              </Chip>
            ) : null}
            <Chip>طبقه {property.floor}</Chip>
            <Chip>ساخت {toFa(property.year)}</Chip>
          </div>

          <p className="mt-3 text-base font-extrabold text-primary">{priceLine(property)}</p>

          <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {property.city} — {property.district}، {property.address}
            </span>
          </p>

          {property.features.length ? (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
              {property.features.map((f) => (
                <Chip key={f}>{f}</Chip>
              ))}
            </div>
          ) : null}

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="size-3.5" />
              {property.ownerName || "—"}
            </span>
            <a
              href={`tel:${property.ownerPhone}`}
              dir="ltr"
              className="inline-flex items-center gap-1 font-bold text-primary"
            >
              <Phone className="size-3.5" />
              {property.ownerPhone || "—"}
            </a>
          </div>

          {property.note ? (
            <p className="mt-3 border-t border-border pt-3 text-xs leading-6 text-muted-foreground">
              {property.note}
            </p>
          ) : null}
        </div>

        <button
          onClick={onDelete}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 text-sm font-bold text-destructive"
        >
          <Trash2 className="size-4" /> حذف این فایل
        </button>

        <LocalOnlyNote />
      </div>
    </Screen>
  );
}
