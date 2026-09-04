import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { Minus, Plus } from "lucide-react";
import { formatPrice, priceLabel, settingsQuery } from "@/lib/store";
import { StoreLayout } from "@/components/site/StoreLayout";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { useCart } from "@/lib/cart";
import { buildOrderMessage, waLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — King's n Queens Haven Couture" },
      {
        name: "description",
        content: "Review your selection and send your order to us on WhatsApp.",
      },
      { property: "og:title", content: "Your Bag — King's n Queens Haven Couture" },
      { property: "og:description", content: "Review your selection and order on WhatsApp." },
    ],
  }),
  component: CartPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z
    .string()
    .trim()
    .min(9, "Enter a valid phone number")
    .max(20)
    .regex(/^[0-9+\s-]+$/, "Numbers only"),
  location: z.string().trim().min(3, "Where should we deliver?").max(200),
  note: z.string().trim().max(500).optional(),
});

function CartPage() {
  const { items, setQuantity, remove, total, hasPendingPrices, clear } = useCart();
  const { data: settings } = useQuery(settingsQuery);
  const symbol = settings?.currency_symbol ?? "GH₵";
  const [form, setForm] = useState({ name: "", phone: "", location: "", note: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
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
    const message = buildOrderMessage({
      businessName: settings?.business_name ?? "King's n Queens Haven Couture",
      items,
      details: parsed.data,
      symbol,
    });
    window.open(waLink(settings?.whatsapp_number, message), "_blank", "noopener");
  };

  return (
    <StoreLayout>
      <section className="mx-auto max-w-[1400px] px-5 pb-28 pt-32 md:px-10 md:pt-44">
        <p className="kicker">Checkout</p>
        <h1 className="mt-3 text-5xl md:text-7xl">Your bag</h1>

        {items.length === 0 ? (
          <div className="py-24 text-center">
            <p className="display text-3xl">Nothing here yet</p>
            <MagneticButton to="/shop" className="mt-8" variant="outline">
              Explore the collection
            </MagneticButton>
          </div>
        ) : (
          <div className="mt-14 grid gap-14 lg:grid-cols-[1.3fr_1fr]">
            <ul className="divide-y divide-border border-y border-border">
              {items.map((item) => (
                <li key={item.id} className="flex gap-5 py-6">
                  <Link
                    to="/product/$slug"
                    params={{ slug: item.slug }}
                    className="h-32 w-24 shrink-0 overflow-hidden bg-sand"
                  >
                    {item.image && (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-4">
                      <p className="text-sm tracking-wide">{item.name}</p>
                      <button
                        onClick={() => remove(item.id)}
                        className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive"
                      >
                        Remove
                      </button>
                    </div>
                    <p
                      className={cn(
                        "mt-1 text-sm",
                        item.price === null ? "italic text-muted-foreground" : "text-forest",
                      )}
                    >
                      {priceLabel(item.price, symbol)}
                    </p>
                    <div className="mt-auto flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
                        className="flex h-9 w-9 items-center justify-center border border-border"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => setQuantity(item.id, item.quantity + 1)}
                        className="flex h-9 w-9 items-center justify-center border border-border"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <form onSubmit={submit} className="bg-card p-7 md:p-9">
              <p className="kicker">Order details</p>
              <h2 className="mt-2 text-3xl">Send on WhatsApp</h2>

              <div className="mt-8 space-y-5">
                {(
                  [
                    { key: "name", label: "Full name", type: "text" },
                    { key: "phone", label: "Phone number", type: "tel" },
                    { key: "location", label: "Delivery location", type: "text" },
                  ] as const
                ).map((f) => (
                  <div key={f.key}>
                    <label className="kicker block">{f.label}</label>
                    <input
                      type={f.type}
                      value={form[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="mt-2 w-full border-b border-border bg-transparent pb-2 text-sm outline-none focus:border-forest"
                    />
                    {errors[f.key] && (
                      <p className="mt-1 text-xs text-destructive">{errors[f.key]}</p>
                    )}
                  </div>
                ))}
                <div>
                  <label className="kicker block">Note (optional)</label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="mt-2 w-full resize-none border-b border-border bg-transparent pb-2 text-sm outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div className="mt-8 flex items-baseline justify-between border-t border-border pt-5">
                <span className="kicker">Total</span>
                <span className="display text-2xl">{formatPrice(total, symbol)}</span>
              </div>
              {hasPendingPrices && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Some items are awaiting pricing — we&apos;ll confirm them with you on WhatsApp.
                </p>
              )}

              <MagneticButton type="submit" className="mt-7 w-full">
                Order on WhatsApp
              </MagneticButton>
              <button
                type="button"
                onClick={clear}
                className="mt-4 w-full text-[0.62rem] uppercase tracking-[0.24em] text-muted-foreground hover:text-destructive"
              >
                Clear bag
              </button>
            </form>
          </div>
        )}
      </section>
    </StoreLayout>
  );
}
