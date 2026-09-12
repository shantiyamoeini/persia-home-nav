import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Archive,
  ArchiveRestore,
  Bed,
  Eye,
  EyeOff,
  MapPin,
  Maximize,
  Pencil,
  Phone,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Chip, Screen, TopBar } from "@/components/app-shell";
import { CardSkeleton, ErrorNote, StorageNote } from "@/components/data-state";
import {
  dealLabels,
  formatDate,
  priceLine,
  propertyTypeLabels,
  statusLabels,
  toFa,
} from "@/lib/data";
import { formatIranPhone } from "@/lib/phone";
import { usePropertySource } from "@/lib/use-properties";

export const Route = createFileRoute("/properties/$propertyId")({
  head: () => ({
    meta: [
      { title: "جزئیات ملک | دستیار املاک" },
      {
        name: "description",
        content: "مشخصات کامل فایل ملک، عکس‌ها، قیمت، امکانات و اطلاعات خصوصی مالک برای دفتر شما.",
      },
      { property: "og:title", content: "جزئیات ملک" },
      { property: "og:description", content: "مشخصات کامل فایل ملک با امکان ویرایش و حذف." },
    ],
  }),
  component: PropertyDetail,
});

function PropertyDetail() {
  const { propertyId } = Route.useParams();
  const { properties, removeProperty, setFlags, loading, cloud, errorMessage } =
    usePropertySource();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const property = properties.find((p) => p.id === propertyId);

  if (loading) {
    return (
      <Screen>
        <TopBar title="جزئیات ملک" back="/properties" />
        <div className="p-4">
          <CardSkeleton count={2} />
        </div>
      </Screen>
    );
  }

  if (!property) {
    return (
      <Screen>
        <TopBar title="ملک یافت نشد" back="/properties" />
        <div className="space-y-3 p-4">
          {errorMessage ? <ErrorNote message={errorMessage} /> : null}
          <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
            این فایل حذف شده یا در دسترس شما نیست.
          </p>
        </div>
      </Screen>
    );
  }

  const onDelete = () => {
    if (!window.confirm("این فایل ملک برای همیشه حذف شود؟ این کار بازگشتی ندارد.")) return;
    void (async () => {
      setBusy(true);
      try {
        await removeProperty(property.id);
        toast.success("فایل ملک حذف شد");
        navigate({ to: "/properties" });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "حذف انجام نشد.");
      } finally {
        setBusy(false);
      }
    })();
  };

  const patch = (
    next: { isPublic?: boolean; archived?: boolean },
    message: string,
  ) => {
    void (async () => {
      setBusy(true);
      try {
        await setFlags(property.id, next);
        toast.success(message);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "به‌روزرسانی انجام نشد.");
      } finally {
        setBusy(false);
      }
    })();
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
            {property.status ? <Chip>{statusLabels[property.status]}</Chip> : null}
            {cloud ? (
              <Chip tone={property.isPublic ? "primary" : undefined}>
                {property.isPublic ? "آگهی عمومی" : "فقط دفتر من"}
              </Chip>
            ) : null}
            {property.archived ? <Chip>بایگانی شده</Chip> : null}
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

          <div className="mt-3 border-t border-border pt-3">
            <p className="mb-2 text-[11px] font-bold text-foreground">اطلاعات خصوصی (فقط دفتر شما)</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <User className="size-3.5" />
                {property.ownerName || "—"}
              </span>
              {property.ownerPhone ? (
                <a
                  href={`tel:0${property.ownerPhone.replace(/^98/, "")}`}
                  dir="ltr"
                  className="inline-flex items-center gap-1 font-bold text-primary"
                >
                  <Phone className="size-3.5" />
                  {formatIranPhone(property.ownerPhone)}
                </a>
              ) : (
                <span>—</span>
              )}
            </div>
            {property.note ? (
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{property.note}</p>
            ) : null}
          </div>
        </div>

        {cloud ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={busy}
              onClick={() =>
                patch(
                  { isPublic: !property.isPublic },
                  property.isPublic ? "آگهی از حالت عمومی خارج شد" : "آگهی عمومی شد",
                )
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-xs font-bold text-foreground disabled:opacity-60"
            >
              {property.isPublic ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {property.isPublic ? "خارج کردن از آگهی عمومی" : "انتشار آگهی عمومی"}
            </button>
            <button
              disabled={busy}
              onClick={() =>
                patch(
                  { archived: !property.archived },
                  property.archived ? "از بایگانی خارج شد" : "به بایگانی رفت",
                )
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-xs font-bold text-foreground disabled:opacity-60"
            >
              {property.archived ? (
                <ArchiveRestore className="size-4" />
              ) : (
                <Archive className="size-4" />
              )}
              {property.archived ? "بازگردانی" : "بایگانی"}
            </button>
          </div>
        ) : null}

        <button
          disabled={busy}
          onClick={onDelete}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 text-sm font-bold text-destructive disabled:opacity-60"
        >
          <Trash2 className="size-4" /> حذف این فایل
        </button>

        <StorageNote cloud={cloud} />
      </div>
    </Screen>
  );
}
