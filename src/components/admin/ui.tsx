import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-2">{children}</div>
      {hint && !error && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-none border border-ink/20 bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-forest";

export function Panel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border border-border bg-card p-5 md:p-7", className)}>
      <h2 className="text-2xl">{title}</h2>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function AdminButton({
  children,
  onClick,
  type = "button",
  variant = "solid",
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "solid" | "outline" | "danger" | "ghost";
  disabled?: boolean | undefined;
  className?: string;
}) {
  const styles = {
    solid: "bg-forest text-primary-foreground hover:bg-forest-deep",
    outline: "border border-ink/25 hover:border-forest hover:text-forest",
    danger: "border border-destructive/40 text-destructive hover:bg-destructive/10",
    ghost: "text-muted-foreground hover:text-foreground",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[0.66rem] uppercase tracking-[0.24em] transition-colors disabled:opacity-50",
        styles,
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-ink/60 p-4 backdrop-blur-sm md:p-10">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "w-full border border-border bg-background p-5 shadow-2xl md:p-8",
          wide ? "max-w-3xl" : "max-w-xl",
        )}
      >
        <div className="flex items-start justify-between gap-6">
          <h2 className="text-2xl">{title}</h2>
          <button
            onClick={onClose}
            className="text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({
  open,
  label,
  onCancel,
  onConfirm,
  busy,
}: {
  open: boolean;
  label: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  return (
    <Modal open={open} onClose={onCancel} title="Please confirm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <AdminButton variant="danger" onClick={onConfirm} disabled={busy}>
          {busy ? "Deleting…" : "Yes, delete"}
        </AdminButton>
        <AdminButton variant="ghost" onClick={onCancel}>
          Cancel
        </AdminButton>
      </div>
    </Modal>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="border border-dashed border-border px-6 py-16 text-center">
      <p className="display text-2xl">{title}</p>
      {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
