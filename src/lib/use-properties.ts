import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback } from "react";

import { useAuth } from "@/lib/auth";
import type { Property, PropertyStatus } from "@/lib/data";
import {
  deleteAgencyProperty,
  listAgencyProperties,
  saveAgencyProperty,
  setAgencyPropertyFlags,
  type PropertyInput,
} from "@/lib/properties.functions";
import { useStore } from "@/lib/store";

export const AGENCY_PROPERTIES_KEY = ["agency", "properties"] as const;

export type PropertySource = {
  /** true when records live in the agency's cloud workspace instead of this device */
  cloud: boolean;
  properties: Property[];
  loading: boolean;
  errorMessage: string | null;
  saving: boolean;
  addProperty: (draft: PropertyInput) => Promise<string>;
  updateProperty: (id: string, draft: PropertyInput) => Promise<string>;
  removeProperty: (id: string) => Promise<void>;
  setFlags: (
    id: string,
    patch: { isPublic?: boolean; archived?: boolean; status?: PropertyStatus },
  ) => Promise<void>;
};

export function usePropertySource(): PropertySource {
  const { session, role, loading: authLoading } = useAuth();
  const cloud = Boolean(session && role === "agency");
  const store = useStore();
  const queryClient = useQueryClient();

  const list = useServerFn(listAgencyProperties);
  const save = useServerFn(saveAgencyProperty);
  const flags = useServerFn(setAgencyPropertyFlags);
  const remove = useServerFn(deleteAgencyProperty);

  const query = useQuery({
    queryKey: AGENCY_PROPERTIES_KEY,
    queryFn: () => list(),
    enabled: cloud,
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: AGENCY_PROPERTIES_KEY });
  }, [queryClient]);

  const saveMutation = useMutation({
    mutationFn: (vars: { id?: string; draft: PropertyInput }) =>
      save({ data: { ...(vars.id ? { id: vars.id } : {}), draft: vars.draft } }),
    onSuccess: invalidate,
  });

  const addProperty = useCallback(
    async (draft: PropertyInput) => {
      if (!cloud) return store.addProperty(draft);
      const result = await saveMutation.mutateAsync({ draft });
      return result.id;
    },
    [cloud, store, saveMutation],
  );

  const updateProperty = useCallback(
    async (id: string, draft: PropertyInput) => {
      if (!cloud) {
        store.updateProperty(id, draft);
        return id;
      }
      const result = await saveMutation.mutateAsync({ id, draft });
      return result.id;
    },
    [cloud, store, saveMutation],
  );

  const removeProperty = useCallback(
    async (id: string) => {
      if (!cloud) {
        store.removeProperty(id);
        return;
      }
      await remove({ data: { id } });
      invalidate();
    },
    [cloud, store, remove, invalidate],
  );

  const setFlags = useCallback(
    async (
      id: string,
      patch: { isPublic?: boolean; archived?: boolean; status?: PropertyStatus },
    ) => {
      if (!cloud) return;
      await flags({ data: { id, ...patch } });
      invalidate();
    },
    [cloud, flags, invalidate],
  );

  return {
    cloud,
    properties: cloud ? (query.data ?? []) : store.properties,
    loading: cloud ? authLoading || query.isPending : !store.ready,
    errorMessage: cloud && query.error ? (query.error as Error).message : null,
    saving: saveMutation.isPending,
    addProperty,
    updateProperty,
    removeProperty,
    setFlags,
  };
}
