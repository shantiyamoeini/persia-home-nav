import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback } from "react";

import { useAuth } from "@/lib/auth";
import {
  deleteAgencyClient,
  listAgencyClients,
  saveAgencyClient,
  type ClientInput,
} from "@/lib/clients.functions";
import type { Client } from "@/lib/data";
import { useStore } from "@/lib/store";

export const AGENCY_CLIENTS_KEY = ["agency", "clients"] as const;

export type ClientSource = {
  /** true when records live in the agency's cloud workspace instead of this device */
  cloud: boolean;
  clients: Client[];
  loading: boolean;
  errorMessage: string | null;
  saving: boolean;
  addClient: (draft: ClientInput) => Promise<string>;
  updateClient: (id: string, draft: ClientInput) => Promise<string>;
  removeClient: (id: string) => Promise<void>;
};

export function useClientSource(): ClientSource {
  const { session, role, loading: authLoading } = useAuth();
  const cloud = Boolean(session && role === "agency");
  const store = useStore();
  const queryClient = useQueryClient();

  const list = useServerFn(listAgencyClients);
  const save = useServerFn(saveAgencyClient);
  const remove = useServerFn(deleteAgencyClient);

  const query = useQuery({
    queryKey: AGENCY_CLIENTS_KEY,
    queryFn: () => list(),
    enabled: cloud,
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: AGENCY_CLIENTS_KEY });
  }, [queryClient]);

  const saveMutation = useMutation({
    mutationFn: (vars: { id?: string; draft: ClientInput }) =>
      save({ data: { ...(vars.id ? { id: vars.id } : {}), draft: vars.draft } }),
    onSuccess: invalidate,
  });

  const addClient = useCallback(
    async (draft: ClientInput) => {
      if (!cloud) return store.addClient(draft);
      const result = await saveMutation.mutateAsync({ draft });
      return result.id;
    },
    [cloud, store, saveMutation],
  );

  const updateClient = useCallback(
    async (id: string, draft: ClientInput) => {
      if (!cloud) {
        store.updateClient(id, draft);
        return id;
      }
      const result = await saveMutation.mutateAsync({ id, draft });
      return result.id;
    },
    [cloud, store, saveMutation],
  );

  const removeClient = useCallback(
    async (id: string) => {
      if (!cloud) {
        store.removeClient(id);
        return;
      }
      await remove({ data: { id } });
      invalidate();
    },
    [cloud, store, remove, invalidate],
  );

  return {
    cloud,
    clients: cloud ? (query.data ?? []) : store.clients,
    loading: cloud ? authLoading || query.isPending : !store.ready,
    errorMessage: cloud && query.error ? (query.error as Error).message : null,
    saving: saveMutation.isPending,
    addClient,
    updateClient,
    removeClient,
  };
}
