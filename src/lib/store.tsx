import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  initialClients,
  initialFollowUps,
  initialProperties,
  type Client,
  type FollowUp,
  type Property,
} from "./data";

type Store = {
  properties: Property[];
  clients: Client[];
  followUps: FollowUp[];
  addProperty: (p: Omit<Property, "id" | "createdAt">) => void;
  addClient: (c: Omit<Client, "id" | "createdAt">) => void;
  addFollowUp: (f: Omit<FollowUp, "id" | "done">) => void;
  toggleFollowUp: (id: string) => void;
};

const StoreContext = createContext<Store | null>(null);

const nowIso = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 9);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [followUps, setFollowUps] = useState<FollowUp[]>(initialFollowUps);

  const value = useMemo<Store>(
    () => ({
      properties,
      clients,
      followUps,
      addProperty: (p) =>
        setProperties((prev) => [{ ...p, id: uid(), createdAt: nowIso() }, ...prev]),
      addClient: (c) =>
        setClients((prev) => [{ ...c, id: uid(), createdAt: nowIso() }, ...prev]),
      addFollowUp: (f) => setFollowUps((prev) => [{ ...f, id: uid(), done: false }, ...prev]),
      toggleFollowUp: (id) =>
        setFollowUps((prev) =>
          prev.map((f) => (f.id === id ? { ...f, done: !f.done } : f)),
        ),
    }),
    [properties, clients, followUps],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
