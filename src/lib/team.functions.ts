import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type TeamMember = {
  userId: string;
  email: string | null;
  displayName: string | null;
  role: "owner" | "admin" | "staff" | null;
  status: string;
  lastSignInAt: string | null;
};

export const listTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TeamMember[]> => {
    const { assertRole } = await import("./admin-guard.server");
    await assertRole(context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: roles }, { data: profiles }, { data: authUsers }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("profiles").select("user_id, email, display_name, status"),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);

    const roleFor = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
    const profileFor = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    return (authUsers?.users ?? [])
      .map((u) => {
        const profile = profileFor.get(u.id);
        return {
          userId: u.id,
          email: profile?.email ?? u.email ?? null,
          displayName: profile?.display_name ?? null,
          role: (roleFor.get(u.id) as TeamMember["role"]) ?? null,
          status: profile?.status ?? "active",
          lastSignInAt: u.last_sign_in_at ?? null,
        };
      })
      .sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0));
  });

export const inviteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; role: "admin" | "staff" }) => {
    const email = input.email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Enter a valid email address.");
    if (input.role !== "admin" && input.role !== "staff") throw new Error("Invalid role.");
    return { email, role: input.role };
  })
  .handler(async ({ data, context }) => {
    const { assertRole } = await import("./admin-guard.server");
    await assertRole(context.userId, "admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { findUserByEmail, setRole } = await import("./team.server");

    let user = await findUserByEmail(data.email);
    let invited = false;
    if (!user) {
      const { data: created, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email);
      if (error) throw new Error(error.message);
      user = created.user;
      invited = true;
    }
    if (!user) throw new Error("Could not create that account.");

    await setRole(user.id, data.role);
    await supabaseAdmin
      .from("profiles")
      .upsert({ user_id: user.id, email: data.email, status: "active" }, { onConflict: "user_id" });
    await supabaseAdmin
      .from("staff_invites")
      .insert({ email: data.email, role: data.role, invited_by: context.userId, accepted_at: invited ? null : new Date().toISOString() });

    return { invited, userId: user.id };
  });

export const changeMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: "admin" | "staff" }) => input)
  .handler(async ({ data, context }) => {
    const { assertRole } = await import("./admin-guard.server");
    await assertRole(context.userId, "owner");
    if (data.userId === context.userId) throw new Error("Use Transfer ownership to change your own role.");
    const { setRole } = await import("./team.server");
    await setRole(data.userId, data.role);
    return { ok: true };
  });

export const setMemberStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; status: "active" | "disabled" }) => input)
  .handler(async ({ data, context }) => {
    const { assertRole, readAccess } = await import("./admin-guard.server");
    await assertRole(context.userId, "admin");
    if (data.userId === context.userId) throw new Error("You cannot disable your own access.");
    const target = await readAccess(data.userId);
    if (target.role === "owner") throw new Error("The owner's access cannot be disabled.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert({ user_id: data.userId, status: data.status }, { onConflict: "user_id" });
    if (error) throw error;
    if (data.status === "disabled") await supabaseAdmin.auth.admin.signOut(data.userId, "global").catch(() => {});
    return { ok: true };
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    const { assertRole, readAccess } = await import("./admin-guard.server");
    await assertRole(context.userId, "owner");
    if (data.userId === context.userId) throw new Error("You cannot remove yourself.");
    const target = await readAccess(data.userId);
    if (target.role === "owner") throw new Error("Transfer ownership before removing an owner.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("profiles").delete().eq("user_id", data.userId);
    await supabaseAdmin.auth.admin.signOut(data.userId, "global").catch(() => {});
    return { ok: true };
  });
