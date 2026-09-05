import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Confirms whether the signed-in user is an admin.
 * If the store has no admin yet, the first signed-in account becomes the admin
 * (bootstrap). No credentials live in client code.
 */
export const ensureAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: admins, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (error) throw error;

    if (!admins || admins.length === 0) {
      const { error: insertError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: context.userId, role: "admin" });
      if (insertError) throw insertError;
      return { isAdmin: true, bootstrapped: true };
    }

    return {
      isAdmin: admins.some((row) => row.user_id === context.userId),
      bootstrapped: false,
    };
  });
