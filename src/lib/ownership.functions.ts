import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Transfer = {
  id: string;
  toEmail: string;
  status: string;
  previousOwnerAction: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
};

/** Transfers relevant to the caller: ones they started, and ones addressed to them. */
export const listTransfers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ outgoing: Transfer[]; incoming: Transfer[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = typeof context.claims["email"] === "string" ? (context.claims["email"] as string).toLowerCase() : "";

    const { data, error } = await supabaseAdmin
      .from("ownership_transfers")
      .select("*")
      .in("status", ["pending", "accepted"])
      .order("created_at", { ascending: false });
    if (error) throw error;

    const map = (row: (typeof rows)[number]): Transfer => ({
      id: row.id,
      toEmail: row.to_email,
      status: row.status,
      previousOwnerAction: row.previous_owner_action,
      expiresAt: row.expires_at,
      acceptedAt: row.accepted_at,
      createdAt: row.created_at,
    });
    const rows = data ?? [];

    return {
      outgoing: rows.filter((r) => r.from_user === context.userId).map(map),
      incoming: rows.filter((r) => r.to_email.toLowerCase() === email && r.from_user !== context.userId).map(map),
    };
  });

export const startTransfer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; previousOwnerAction: "demote" | "remove" }) => {
    const email = input.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Enter a valid email address.");
    return { email, previousOwnerAction: input.previousOwnerAction };
  })
  .handler(async ({ data, context }) => {
    const { assertRole } = await import("./admin-guard.server");
    await assertRole(context.userId, "owner");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { findUserByEmail, setRole } = await import("./team.server");

    const ownEmail = typeof context.claims["email"] === "string" ? (context.claims["email"] as string).toLowerCase() : "";
    if (data.email === ownEmail) throw new Error("You already own this store.");

    let user = await findUserByEmail(data.email);
    if (!user) {
      const { data: created, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email);
      if (error) throw new Error(error.message);
      user = created.user;
    }
    if (!user) throw new Error("Could not invite that email address.");
    await setRole(user.id, "admin");
    await supabaseAdmin
      .from("profiles")
      .upsert({ user_id: user.id, email: data.email, status: "active" }, { onConflict: "user_id" });

    await supabaseAdmin
      .from("ownership_transfers")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("from_user", context.userId)
      .in("status", ["pending", "accepted"]);

    const { error: insertError } = await supabaseAdmin.from("ownership_transfers").insert({
      from_user: context.userId,
      to_email: data.email,
      to_user: user.id,
      previous_owner_action: data.previousOwnerAction,
      status: "pending",
    });
    if (insertError) throw insertError;
    return { ok: true };
  });

export const acceptTransfer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = typeof context.claims["email"] === "string" ? (context.claims["email"] as string).toLowerCase() : "";

    const { data: row, error } = await supabaseAdmin
      .from("ownership_transfers")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!row || row.status !== "pending") throw new Error("This transfer is no longer available.");
    if (row.to_email.toLowerCase() !== email) throw new Error("This transfer was addressed to another account.");
    if (new Date(row.expires_at) < new Date()) throw new Error("This transfer has expired.");

    const { error: updateError } = await supabaseAdmin
      .from("ownership_transfers")
      .update({ status: "accepted", accepted_at: new Date().toISOString(), to_user: context.userId })
      .eq("id", data.id);
    if (updateError) throw updateError;
    return { ok: true };
  });

/** Final, irreversible step — only the current owner can run it. */
export const confirmTransfer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { assertRole } = await import("./admin-guard.server");
    await assertRole(context.userId, "owner");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { setRole } = await import("./team.server");

    const { data: row, error } = await supabaseAdmin
      .from("ownership_transfers")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!row || row.from_user !== context.userId) throw new Error("Transfer not found.");
    if (row.status !== "accepted" || !row.to_user) throw new Error("The buyer has not accepted yet.");

    await setRole(row.to_user, "owner");

    if (row.previous_owner_action === "remove") {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", context.userId);
      await supabaseAdmin.from("profiles").delete().eq("user_id", context.userId);
      await supabaseAdmin.auth.admin.signOut(context.userId, "global").catch(() => {});
    } else {
      await setRole(context.userId, "admin");
    }

    await supabaseAdmin
      .from("ownership_transfers")
      .update({ status: "completed", confirmed_at: new Date().toISOString() })
      .eq("id", data.id);
    return { ok: true, previousOwnerAction: row.previous_owner_action };
  });

export const cancelTransfer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { assertRole } = await import("./admin-guard.server");
    await assertRole(context.userId, "owner");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("ownership_transfers")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("from_user", context.userId);
    if (error) throw error;
    return { ok: true };
  });
