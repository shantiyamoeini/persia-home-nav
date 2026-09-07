import { Link } from "@tanstack/react-router";
import { Bed, ImageOff, MapPin, Maximize, Phone, User, Wallet } from "lucide-react";
import { Chip } from "./app-shell";
import {
  dealLabels,
  formatPrice,
  priceLine,
  propertyTypeLabels,
  toFa,
  type Client,
  type Property,
} from "@/lib/data";

export function PropertyCard({ property }: { property: Property }) {
  return (
    <Link
      to="/properties/$propertyId"
      params={{ propertyId: property.id }}
      className="block rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/50"
    >
      {property.photos?.[0] ? (
        <img
          src={property.photos[0]}
          alt={property.title}
          className="mb-3 h-36 w-full rounded-xl object-cover"
        />
      ) : (
        <div className="mb-3 grid h-20 w-full place-items-center rounded-xl bg-secondary text-muted-foreground">
          <ImageOff className="size-5" />
        </div>
      )}
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
        <Chip>طبقه {property.floor}</Chip>
        <Chip>ساخت {toFa(property.year)}</Chip>
      </div>

      {property.features.length ? (
        <p className="mt-3 text-[11px] text-muted-foreground">
          امکانات: {property.features.join(" · ")}
        </p>
      ) : null}

      <div className="mt-3 border-t border-border pt-3">
        <p className="text-sm font-bold text-primary">{priceLine(property)}</p>
        <p className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <User className="size-3" />
            {property.ownerName}
          </span>
          <span className="inline-flex items-center gap-1" dir="ltr">
            <Phone className="size-3" />
            {property.ownerPhone}
          </span>
        </p>
      </div>
    </Link>
  );
}

export function ClientCard({ client }: { client: Client }) {
  return (
    <Link
      to="/clients/$clientId"
      params={{ clientId: client.id }}
      className="block rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/50"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {client.name.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-foreground">{client.name}</h3>
            <p className="text-[11px] text-muted-foreground" dir="ltr">
              {client.phone}
            </p>
          </div>
        </div>
        <Chip tone={client.interest === "sale" ? "primary" : "accent"}>
          متقاضی {dealLabels[client.interest]}
        </Chip>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Chip>{propertyTypeLabels[client.type]}</Chip>
        <Chip>{client.district}</Chip>
        <Chip>حداقل {toFa(client.minArea)} متر</Chip>
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
  );
}
