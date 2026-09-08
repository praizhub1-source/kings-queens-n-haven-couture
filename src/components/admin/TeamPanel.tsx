import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listTeam, inviteMember, changeMemberRole, setMemberStatus, removeMember } from "@/lib/team.functions";
import {
  listTransfers,
  startTransfer,
  acceptTransfer,
  confirmTransfer,
  cancelTransfer,
} from "@/lib/ownership.functions";
import { AdminButton, Confirm, EmptyState, Field, Panel, inputClass } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

type Role = "owner" | "admin" | "staff";

function useErrorToast() {
  return (error: unknown) =>
    toast.error(error instanceof Error ? error.message : "Something went wrong");
}

export function TeamPanel({ role, userId }: { role: Role | null; userId: string }) {
  const qc = useQueryClient();
  const onError = useErrorToast();
  const fetchTeam = useServerFn(listTeam);
  const invite = useServerFn(inviteMember);
  const changeRole = useServerFn(changeMemberRole);
  const setStatus = useServerFn(setMemberStatus);
  const remove = useServerFn(removeMember);

  const isOwner = role === "owner";
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "staff">("staff");
  const [removing, setRemoving] = useState<{ userId: string; email: string | null } | null>(null);

  const team = useQuery({ queryKey: ["team"], queryFn: () => fetchTeam({ data: undefined as never }) });
  const refresh = () => qc.invalidateQueries({ queryKey: ["team"] });

  const inviteMut = useMutation({
    mutationFn: (vars: { email: string; role: "admin" | "staff" }) => invite({ data: vars }),
    onSuccess: (res) => {
      toast.success(res.invited ? "Invitation sent" : "Access granted to that account");
      setEmail("");
      refresh();
    },
    onError,
  });

  const roleMut = useMutation({
    mutationFn: (vars: { userId: string; role: "admin" | "staff" }) => changeRole({ data: vars }),
    onSuccess: () => { toast.success("Role updated"); refresh(); },
    onError,
  });

  const statusMut = useMutation({
    mutationFn: (vars: { userId: string; status: "active" | "disabled" }) => setStatus({ data: vars }),
    onSuccess: () => { toast.success("Access updated"); refresh(); },
    onError,
  });

  const removeMut = useMutation({
    mutationFn: (vars: { userId: string }) => remove({ data: vars }),
    onSuccess: () => { toast.success("Team member removed"); setRemoving(null); refresh(); },
    onError,
  });

  const submitInvite = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    inviteMut.mutate({ email, role: inviteRole });
  };

  return (
    <div>
      <p className="kicker">People</p>
      <h2 className="mt-2 text-4xl">Team &amp; access</h2>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Owners control everything, including ownership transfer. Admins manage the store and invite staff.
        Staff manage the catalogue only.
      </p>

      <Panel title="Invite a team member" className="mt-8">
        <form onSubmit={submitInvite} className="grid gap-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
          <Field label="Email address">
            <input
              className={inputClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </Field>
          <Field label="Role">
            <select className={inputClass} value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "admin" | "staff")}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <AdminButton type="submit" disabled={inviteMut.isPending}>
            {inviteMut.isPending ? "Sending…" : "Send invite"}
          </AdminButton>
        </form>
      </Panel>

      <Panel title="Current team" className="mt-6">
        {team.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading team…
          </p>
        ) : (team.data ?? []).length === 0 ? (
          <EmptyState title="No team members yet" />
        ) : (
          <div className="space-y-2">
            {(team.data ?? []).map((m) => (
              <div key={m.userId} className="grid gap-3 border border-border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm">{m.displayName || m.email || "Unnamed account"}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.email} · {m.role ?? "no access"}
                    {m.status !== "active" ? " · disabled" : ""}
                    {m.userId === userId ? " · you" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isOwner && m.role !== "owner" && m.userId !== userId && (
                    <select
                      aria-label={`Role for ${m.email ?? "member"}`}
                      className={cn(inputClass, "h-9 w-32 py-0 text-xs")}
                      value={m.role ?? "staff"}
                      onChange={(e) => roleMut.mutate({ userId: m.userId, role: e.target.value as "admin" | "staff" })}
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                  {m.role !== "owner" && m.userId !== userId && (
                    <AdminButton
                      variant="ghost"
                      onClick={() => statusMut.mutate({ userId: m.userId, status: m.status === "active" ? "disabled" : "active" })}
                    >
                      {m.status === "active" ? "Disable" : "Enable"}
                    </AdminButton>
                  )}
                  {isOwner && m.role !== "owner" && m.userId !== userId && (
                    <AdminButton variant="ghost" onClick={() => setRemoving({ userId: m.userId, email: m.email })}>
                      Remove
                    </AdminButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <TransferPanel isOwner={isOwner} />

      <Confirm
        open={Boolean(removing)}
        label={`Remove ${removing?.email ?? "this member"}? They lose all access immediately.`}
        onCancel={() => setRemoving(null)}
        onConfirm={() => removing && removeMut.mutate({ userId: removing.userId })}
        busy={removeMut.isPending}
      />
    </div>
  );
}

function TransferPanel({ isOwner }: { isOwner: boolean }) {
  const qc = useQueryClient();
  const onError = useErrorToast();
  const fetchTransfers = useServerFn(listTransfers);
  const start = useServerFn(startTransfer);
  const accept = useServerFn(acceptTransfer);
  const confirm = useServerFn(confirmTransfer);
  const cancel = useServerFn(cancelTransfer);

  const [buyerEmail, setBuyerEmail] = useState("");
  const [action, setAction] = useState<"demote" | "remove">("demote");
  const [confirming, setConfirming] = useState<string | null>(null);

  const transfers = useQuery({
    queryKey: ["ownership-transfers"],
    queryFn: () => fetchTransfers({ data: undefined as never }),
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["ownership-transfers"] });
    qc.invalidateQueries({ queryKey: ["team"] });
    qc.invalidateQueries({ queryKey: ["my-access"] });
  };

  const startMut = useMutation({
    mutationFn: (vars: { email: string; previousOwnerAction: "demote" | "remove" }) => start({ data: vars }),
    onSuccess: () => { toast.success("Transfer started. The buyer must accept it."); setBuyerEmail(""); refresh(); },
    onError,
  });
  const acceptMut = useMutation({
    mutationFn: (vars: { id: string }) => accept({ data: vars }),
    onSuccess: () => { toast.success("Accepted. The current owner must confirm."); refresh(); },
    onError,
  });
  const confirmMut = useMutation({
    mutationFn: (vars: { id: string }) => confirm({ data: vars }),
    onSuccess: () => { toast.success("Ownership transferred"); setConfirming(null); refresh(); },
    onError,
  });
  const cancelMut = useMutation({
    mutationFn: (vars: { id: string }) => cancel({ data: vars }),
    onSuccess: () => { toast.success("Transfer cancelled"); refresh(); },
    onError,
  });

  const incoming = transfers.data?.incoming ?? [];
  const outgoing = transfers.data?.outgoing ?? [];

  return (
    <>
      {incoming.length > 0 && (
        <Panel title="Ownership offered to you" className="mt-6">
          {incoming.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                You have been offered ownership of this store. Expires {new Date(t.expiresAt).toLocaleDateString()}.
              </p>
              {t.status === "pending" ? (
                <AdminButton onClick={() => acceptMut.mutate({ id: t.id })} disabled={acceptMut.isPending}>
                  Accept ownership
                </AdminButton>
              ) : (
                <span className="text-xs text-muted-foreground">Accepted — waiting for the owner to confirm.</span>
              )}
            </div>
          ))}
        </Panel>
      )}

      {isOwner && (
        <Panel title="Transfer ownership" className="mt-6">
          <div className="mb-5 flex gap-3 border border-destructive/30 bg-destructive/5 p-4 text-xs text-muted-foreground">
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
            <p>
              Transferring ownership is irreversible. Once you confirm, the buyer becomes the owner and you keep only
              the access you choose below.
            </p>
          </div>

          {outgoing.length > 0 ? (
            outgoing.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 border border-border bg-card p-4">
                <div>
                  <p className="text-sm">{t.toEmail}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.status === "pending" ? "Waiting for the buyer to accept" : "Accepted — ready for your final confirmation"}
                    {" · you will be "}
                    {t.previousOwnerAction === "remove" ? "removed" : "kept as admin"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {t.status === "accepted" && (
                    <AdminButton onClick={() => setConfirming(t.id)}>Confirm transfer</AdminButton>
                  )}
                  <AdminButton variant="ghost" onClick={() => cancelMut.mutate({ id: t.id })}>Cancel</AdminButton>
                </div>
              </div>
            ))
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!buyerEmail.trim()) return;
                startMut.mutate({ email: buyerEmail, previousOwnerAction: action });
              }}
              className="grid gap-4 sm:grid-cols-[1fr_200px_auto] sm:items-end"
            >
              <Field label="Buyer email">
                <input className={inputClass} type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} required />
              </Field>
              <Field label="After transfer, I become">
                <select className={inputClass} value={action} onChange={(e) => setAction(e.target.value as "demote" | "remove")}>
                  <option value="demote">An admin</option>
                  <option value="remove">Removed entirely</option>
                </select>
              </Field>
              <AdminButton type="submit" disabled={startMut.isPending}>
                {startMut.isPending ? "Starting…" : "Start transfer"}
              </AdminButton>
            </form>
          )}
        </Panel>
      )}

      <Confirm
        open={Boolean(confirming)}
        label="This is irreversible. The buyer becomes the owner of this store and your own access is reduced immediately."
        onCancel={() => setConfirming(null)}
        onConfirm={() => confirming && confirmMut.mutate({ id: confirming })}
        busy={confirmMut.isPending}
      />
    </>
  );
}

export function AccountPanel({
  email,
  displayName,
  userId,
}: {
  email: string | null;
  displayName: string | null;
  userId: string;
}) {
  const onError = useErrorToast();
  const [name, setName] = useState(displayName ?? "");
  const [newEmail, setNewEmail] = useState(email ?? "");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    setBusy("name");
    const { error } = await supabase.from("profiles").update({ display_name: name.trim() || null }).eq("user_id", userId);
    setBusy(null);
    if (error) return onError(error);
    toast.success("Name saved");
  };

  const saveEmail = async (e: FormEvent) => {
    e.preventDefault();
    setBusy("email");
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setBusy(null);
    if (error) return onError(error);
    toast.success("Check your inbox to confirm the new email address.");
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Use at least 8 characters.");
    setBusy("password");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(null);
    if (error) return onError(error);
    setPassword("");
    toast.success("Password updated");
  };

  const sendReset = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) return onError(error);
    toast.success("Password reset link sent");
  };

  return (
    <div>
      <p className="kicker">Your account</p>
      <h2 className="mt-2 text-4xl">Account &amp; security</h2>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel title="Display name">
          <form onSubmit={saveName} className="space-y-4">
            <Field label="Name shown to the team">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <AdminButton type="submit" disabled={busy === "name"}>{busy === "name" ? "Saving…" : "Save name"}</AdminButton>
          </form>
        </Panel>

        <Panel title="Email address">
          <form onSubmit={saveEmail} className="space-y-4">
            <Field label="Sign-in email" hint="You must confirm the change from your inbox.">
              <input className={inputClass} type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
            </Field>
            <AdminButton type="submit" disabled={busy === "email"}>{busy === "email" ? "Saving…" : "Update email"}</AdminButton>
          </form>
        </Panel>

        <Panel title="Password">
          <form onSubmit={savePassword} className="space-y-4">
            <Field label="New password" hint="At least 8 characters.">
              <input className={inputClass} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <div className="flex flex-wrap gap-3">
              <AdminButton type="submit" disabled={busy === "password"}>{busy === "password" ? "Saving…" : "Change password"}</AdminButton>
              <AdminButton variant="ghost" onClick={sendReset}>Email me a reset link</AdminButton>
            </div>
          </form>
        </Panel>

        <Panel title="Sessions">
          <p className="text-sm text-muted-foreground">Sign out of this device and every other browser where you are signed in.</p>
          <AdminButton
            className="mt-4"
            variant="ghost"
            onClick={async () => {
              await supabase.auth.signOut({ scope: "global" });
              window.location.assign("/auth");
            }}
          >
            Sign out everywhere
          </AdminButton>
        </Panel>
      </div>
    </div>
  );
}
