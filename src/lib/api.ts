import { supabase } from "@/integrations/supabase/client";
import type { Client, FollowUp, Property } from "./data";

export const queryKeys = {
  properties: ["properties"] as const,
  property: (id: string) => ["properties", id] as const,
  clients: ["clients"] as const,
  client: (id: string) => ["clients", id] as const,
  followUps: ["follow_ups"] as const,
  clientFollowUps: (id: string) => ["follow_ups", "client", id] as const,
};

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("برای انجام این کار باید وارد حساب شوید.");
  return data.user.id;
}

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }) {
  if (error) throw new Error(error.message);
  return data as T;
}

/* ---------------- properties ---------------- */

export async function listProperties() {
  return unwrap<Property[]>(
    await supabase.from("properties").select("*").order("created_at", { ascending: false }),
  );
}

export async function getProperty(id: string) {
  return unwrap<Property>(await supabase.from("properties").select("*").eq("id", id).single());
}

export type PropertyInput = Omit<Property, "id" | "created_at">;

export async function createProperty(input: PropertyInput) {
  const user_id = await currentUserId();
  return unwrap<Property>(
    await supabase.from("properties").insert({ ...input, user_id }).select().single(),
  );
}

export async function updateProperty(id: string, input: PropertyInput) {
  return unwrap<Property>(
    await supabase.from("properties").update(input).eq("id", id).select().single(),
  );
}

export async function deleteProperty(id: string) {
  const { error } = await supabase.from("properties").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- clients ---------------- */

export async function listClients() {
  return unwrap<Client[]>(
    await supabase.from("clients").select("*").order("created_at", { ascending: false }),
  );
}

export async function getClient(id: string) {
  return unwrap<Client>(await supabase.from("clients").select("*").eq("id", id).single());
}

export type ClientInput = Omit<Client, "id" | "created_at">;

export async function createClient(input: ClientInput) {
  const user_id = await currentUserId();
  return unwrap<Client>(
    await supabase.from("clients").insert({ ...input, user_id }).select().single(),
  );
}

export async function updateClient(id: string, input: ClientInput) {
  return unwrap<Client>(
    await supabase.from("clients").update(input).eq("id", id).select().single(),
  );
}

export async function deleteClient(id: string) {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- follow ups ---------------- */

export async function listFollowUps() {
  return unwrap<FollowUp[]>(
    await supabase
      .from("follow_ups")
      .select("*")
      .order("due_date", { ascending: true })
      .order("due_time", { ascending: true }),
  );
}

export async function listClientFollowUps(clientId: string) {
  return unwrap<FollowUp[]>(
    await supabase
      .from("follow_ups")
      .select("*")
      .eq("client_id", clientId)
      .order("due_date", { ascending: false }),
  );
}

export type FollowUpInput = Omit<FollowUp, "id" | "created_at">;

export async function createFollowUp(input: FollowUpInput) {
  const user_id = await currentUserId();
  return unwrap<FollowUp>(
    await supabase.from("follow_ups").insert({ ...input, user_id }).select().single(),
  );
}

export async function updateFollowUp(id: string, input: Partial<FollowUpInput>) {
  return unwrap<FollowUp>(
    await supabase.from("follow_ups").update(input).eq("id", id).select().single(),
  );
}

export async function deleteFollowUp(id: string) {
  const { error } = await supabase.from("follow_ups").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------------- photos ---------------- */

const BUCKET = "property-photos";

export async function uploadPhoto(file: File) {
  const userId = await currentUserId();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function removePhoto(path: string) {
  await supabase.storage.from(BUCKET).remove([path]);
}

export async function signPhotos(paths: string[]) {
  if (paths.length === 0) return {} as Record<string, string>;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
  if (error) throw new Error(error.message);
  const map: Record<string, string> = {};
  data?.forEach((item, index) => {
    const key = paths[index];
    if (key && item.signedUrl) map[key] = item.signedUrl;
  });
  return map;
}
