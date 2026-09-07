import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function findUserByEmail(email: string) {
  const target = email.trim().toLowerCase();
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const match = data.users.find((u) => (u.email ?? "").toLowerCase() === target);
    if (match) return match;
    if (data.users.length < 200) break;
  }
  return null;
}

/** One role per user: clears any existing rows before assigning. */
export async function setRole(userId: string, role: "owner" | "admin" | "staff") {
  const { error: insertError } = await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
  if (insertError) throw insertError;
  const { error } = await supabaseAdmin
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .neq("role", role);
  if (error) throw error;
}
