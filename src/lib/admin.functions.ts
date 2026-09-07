import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Returns the signed-in user's real role, read server-side.
 * Bootstrap: while the store has NO owner at all, the first signed-in account
 * becomes the owner. Ownership stays fully transferable afterwards.
 */
export const getMyAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { readAccess } = await import("./admin-guard.server");

    const { count, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "owner");
    if (error) throw error;

    let bootstrapped = false;
    if ((count ?? 0) === 0) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", context.userId);
      const { error: insertError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: context.userId, role: "owner" });
      if (insertError) throw insertError;
      bootstrapped = true;
    }

    const email = typeof context.claims["email"] === "string" ? (context.claims["email"] as string) : null;
    await supabaseAdmin
      .from("profiles")
      .upsert({ user_id: context.userId, email, status: "active" }, { onConflict: "user_id" });

    const access = await readAccess(context.userId);
    return { ...access, email: access.email ?? email, bootstrapped };
  });
