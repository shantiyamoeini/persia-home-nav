import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  initialClients,
  initialFollowUps,
  initialProperties,
  type Client,
  type FollowUp,
  type Property,
} from "./data";
import { clearDataset, loadDataset, saveDataset } from "./local-db";

type Store = {
  ready: boolean;
  properties: Property[];
  clients: Client[];
  followUps: FollowUp[];
  addProperty: (p: Omit<Property, "id" | "createdAt">) => string;
  updateProperty: (id: string, p: Omit<Property, "id" | "createdAt">) => void;
  removeProperty: (id: string) => void;
  addClient: (c: Omit<Client, "id" | "createdAt">) => string;
  updateClient: (id: string, c: Omit<Client, "id" | "createdAt">) => void;
  removeClient: (id: string) => void;
  addFollowUp: (f: Omit<FollowUp, "id" | "done">) => void;
  removeFollowUp: (id: string) => void;
  toggleFollowUp: (id: string) => void;
  resetToDemo: () => void;
  clearAll: () => void;
};

const StoreContext = createContext<Store | null>(null);

const nowIso = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 9);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [followUps, setFollowUps] = useState<FollowUp[]>(initialFollowUps);
  const loaded = useRef(false);

  useEffect(() => {
    let alive = true;
    loadDataset().then((data) => {
      if (!alive) return;
      if (data) {
        setProperties(data.properties ?? []);
        setClients(data.clients ?? []);
        setFollowUps(data.followUps ?? []);
      }
      loaded.current = true;
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    void saveDataset({ properties, clients, followUps });
  }, [properties, clients, followUps]);

  const clearAll = useCallback(() => {
    setProperties([]);
    setClients([]);
    setFollowUps([]);
    void clearDataset();
  }, []);

  const resetToDemo = useCallback(() => {
    setProperties(initialProperties);
    setClients(initialClients);
    setFollowUps(initialFollowUps);
  }, []);

  const value = useMemo<Store>(
    () => ({
      ready,
      properties,
      clients,
      followUps,
      addProperty: (p) => {
        const id = uid();
        setProperties((prev) => [{ ...p, id, createdAt: nowIso() }, ...prev]);
        return id;
      },
      updateProperty: (id, p) =>
        setProperties((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...p, id } : item)),
        ),
      removeProperty: (id) => setProperties((prev) => prev.filter((item) => item.id !== id)),
      addClient: (c) => {
        const id = uid();
        setClients((prev) => [{ ...c, id, createdAt: nowIso() }, ...prev]);
        return id;
      },
      updateClient: (id, c) =>
        setClients((prev) => prev.map((item) => (item.id === id ? { ...item, ...c, id } : item))),
      removeClient: (id) => setClients((prev) => prev.filter((item) => item.id !== id)),
      addFollowUp: (f) => setFollowUps((prev) => [{ ...f, id: uid(), done: false }, ...prev]),
      removeFollowUp: (id) => setFollowUps((prev) => prev.filter((f) => f.id !== id)),
      toggleFollowUp: (id) =>
        setFollowUps((prev) => prev.map((f) => (f.id === id ? { ...f, done: !f.done } : f))),
      resetToDemo,
      clearAll,
    }),
    [ready, properties, clients, followUps, clearAll, resetToDemo],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
