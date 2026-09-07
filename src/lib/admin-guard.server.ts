import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type Role = "owner" | "admin" | "staff";
export type Access = {
  role: Role | null;
  status: string;
  isOwner: boolean;
  isStaff: boolean;
  userId: string;
  email: string | null;
  displayName: string | null;
};

const RANK: Record<Role, number> = { staff: 1, admin: 2, owner: 3 };

/** Reads the caller's real role from the database with service-role privileges. */
export async function readAccess(userId: string): Promise<Access> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [{ data: roles }, { data: profile }] = await Promise.all([
    supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
    supabaseAdmin.from("profiles").select("display_name, email, status").eq("user_id", userId).maybeSingle(),
  ]);

  const role = (roles ?? [])
    .map((r) => r.role as Role)
    .sort((a, b) => RANK[b] - RANK[a])[0] ?? null;
  const status = profile?.status ?? "active";
  const active = status === "active";

  return {
    role,
    status,
    isOwner: active && role === "owner",
    isStaff: active && role !== null,
    userId,
    email: profile?.email ?? null,
    displayName: profile?.display_name ?? null,
  };
}

/** Throws unless the caller is an active team member of at least `minimum` rank. */
export async function assertRole(userId: string, minimum: Role): Promise<Access> {
  const access = await readAccess(userId);
  if (!access.role || access.status !== "active" || RANK[access.role] < RANK[minimum]) {
    throw new Error("Forbidden: you do not have permission for this action.");
  }
  return access;
}

export type AdminClient = SupabaseClient<Database>;
