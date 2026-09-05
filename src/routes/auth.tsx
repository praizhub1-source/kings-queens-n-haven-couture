import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MagneticButton } from "@/components/motion/MagneticButton";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Studio Access — King's n Queens Haven Couture" },
      {
        name: "description",
        content: "Private studio access for the King's n Queens Haven Couture team.",
      },
      { property: "og:title", content: "Studio Access — King's n Queens Haven Couture" },
      { property: "og:description", content: "Private studio access for the team." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        next[String(i.path[0])] = i.message;
      });
      setErrors(next);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        const { error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
        if (signInError) {
          toast.success("Account created. Confirm your email, then sign in.");
          setMode("signin");
          return;
        }
        toast.success("Welcome to the studio.");
        navigate({ to: "/admin", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        navigate({ to: "/admin", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-forest-deep px-5 py-20">
      <div className="w-full max-w-md">
        <Link to="/" className="kicker text-champagne">
          ← King&apos;s n Queens Haven Couture
        </Link>
        <h1 className="mt-6 text-4xl text-ivory md:text-5xl">Studio access</h1>
        <p className="mt-3 text-sm text-ivory/60">
          For the store team only. Customers never need an account to order.
        </p>

        <form onSubmit={submit} className="mt-10 space-y-5">
          <div>
            <label className="kicker text-ivory/60" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-2 w-full border-b border-ivory/25 bg-transparent py-3 text-ivory outline-none focus:border-champagne"
            />
            {errors["email"] && <p className="mt-2 text-xs text-red-300">{errors["email"]}</p>}
          </div>
          <div>
            <label className="kicker text-ivory/60" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-2 w-full border-b border-ivory/25 bg-transparent py-3 text-ivory outline-none focus:border-champagne"
            />
            {errors["password"] && <p className="mt-2 text-xs text-red-300">{errors["password"]}</p>}
          </div>

          <MagneticButton type="submit" variant="light" disabled={busy} className="w-full">
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create studio account"}
          </MagneticButton>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-8 text-[0.68rem] uppercase tracking-[0.24em] text-ivory/60 hover:text-champagne"
        >
          {mode === "signin" ? "First time? Create the studio account" : "Already have access? Sign in"}
        </button>
      </div>
    </main>
  );
}
