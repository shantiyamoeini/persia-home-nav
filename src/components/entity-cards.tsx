import { Link } from "@tanstack/react-router";
import {
  Bed,
  Images,
  MapPin,
  Maximize,
  Pencil,
  Phone,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import { Chip } from "./app-shell";
import { usePhotoUrls } from "./photo-uploader";
import {
  dealLabels,
  formatPrice,
  priceLine,
  propertyTypeLabels,
  toFa,
  type Client,
  type Property,
} from "@/lib/data";

export function PropertyCard({
  property,
  onDelete,
}: {
  property: Property;
  onDelete?: () => void;
}) {
  const cover = property.photos.slice(0, 1);
  const { data: urls } = usePhotoUrls(cover);
  const coverUrl = cover[0] ? urls?.[cover[0]] : undefined;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {cover.length ? (
        <div className="relative aspect-video bg-secondary">
          {coverUrl ? (
            <img src={coverUrl} alt={property.title} className="size-full object-cover" />
          ) : null}
          {property.photos.length > 1 ? (
            <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-[10px] font-bold text-foreground">
              <Images className="size-3" /> {toFa(property.photos.length)} عکس
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <h3 className="min-w-0 text-sm font-bold leading-6 text-foreground">
            {property.title}
          </h3>
          <Chip tone={property.deal === "sale" ? "primary" : "accent"}>
            {dealLabels[property.deal]}
          </Chip>
        </div>

        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {property.district} — {property.address}
          </span>
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
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
          {property.floor ? <Chip>طبقه {property.floor}</Chip> : null}
          <Chip>ساخت {toFa(property.build_year)}</Chip>
        </div>

        {property.features.length ? (
          <p className="mt-3 text-[11px] text-muted-foreground">
            امکانات: {property.features.join(" · ")}
          </p>
        ) : null}
        {property.note ? (
          <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{property.note}</p>
        ) : null}

        <div className="mt-3 border-t border-border pt-3">
          <p className="text-sm font-bold text-primary">{priceLine(property)}</p>
          <p className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="size-3" />
              {property.owner_name || "بدون مالک"}
            </span>
            <span className="inline-flex items-center gap-1" dir="ltr">
              <Phone className="size-3" />
              {property.owner_phone || "—"}
            </span>
          </p>
        </div>

        {onDelete ? (
          <div className="mt-3 flex gap-2">
            <Link
              to="/properties/$id/edit"
              params={{ id: property.id }}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-secondary py-2 text-xs font-bold text-secondary-foreground"
            >
              <Pencil className="size-3.5" /> ویرایش
            </Link>
            <button
              onClick={onDelete}
              className="inline-flex items-center justify-center gap-1 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive"
            >
              <Trash2 className="size-3.5" /> حذف
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function ClientCard({
  client,
  onDelete,
}: {
  client: Client;
  onDelete?: () => void;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <Link to="/clients/$id" params={{ id: client.id }} className="block">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {client.name.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-foreground">{client.name}</h3>
              <p className="text-[11px] text-muted-foreground" dir="ltr">
                {client.phone || "—"}
              </p>
            </div>
          </div>
          <Chip tone={client.interest === "sale" ? "primary" : "accent"}>
            متقاضی {dealLabels[client.interest]}
          </Chip>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Chip>{propertyTypeLabels[client.type]}</Chip>
          {client.district ? <Chip>{client.district}</Chip> : null}
          {client.min_area > 0 ? <Chip>حداقل {toFa(client.min_area)} متر</Chip> : null}
          {client.rooms > 0 ? <Chip>{toFa(client.rooms)} خواب</Chip> : null}
        </div>

        <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-xs font-semibold text-foreground">
          <Wallet className="size-3.5 text-primary" />
          بودجه: {formatPrice(client.budget)}
        </p>
        {client.note ? (
          <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{client.note}</p>
        ) : null}
      </Link>

      {onDelete ? (
        <div className="mt-3 flex gap-2">
          <Link
            to="/clients/$id"
            params={{ id: client.id }}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary/10 py-2 text-xs font-bold text-primary"
          >
            پرونده مشتری
          </Link>
          <Link
            to="/clients/$id/edit"
            params={{ id: client.id }}
            className="inline-flex items-center justify-center gap-1 rounded-xl bg-secondary px-3 py-2 text-xs font-bold text-secondary-foreground"
          >
            <Pencil className="size-3.5" /> ویرایش
          </Link>
          <button
            onClick={onDelete}
            className="inline-flex items-center justify-center gap-1 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ) : null}
    </article>
  );
}
