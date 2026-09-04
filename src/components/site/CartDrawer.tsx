import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice, priceLabel, settingsQuery } from "@/lib/store";
import { cn } from "@/lib/utils";
import { MagneticButton } from "@/components/motion/MagneticButton";

export function CartDrawer() {
  const { items, isOpen, closeCart, setQuantity, remove, total, hasPendingPrices, count } =
    useCart();
  const { data: settings } = useQuery(settingsQuery);
  const symbol = settings?.currency_symbol ?? "GH₵";

  return (
    <>
      <div
        onClick={closeCart}
        aria-hidden
        className={cn(
          "fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm transition-opacity duration-500",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        aria-hidden={!isOpen}
        className={cn(
          "fixed right-0 top-0 z-[70] flex h-dvh w-full max-w-md flex-col bg-background shadow-2xl transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <p className="kicker">Your bag</p>
            <p className="display mt-1 text-2xl">{count} item{count === 1 ? "" : "s"}</p>
          </div>
          <button onClick={closeCart} aria-label="Close cart" className="p-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="display text-2xl">Your bag is empty</p>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                Pieces you add will be kept here while you browse.
              </p>
              <MagneticButton to="/shop" className="mt-8" onClick={closeCart} variant="outline">
                Browse collection
              </MagneticButton>
            </div>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4">
                  <Link
                    to="/product/$slug"
                    params={{ slug: item.slug }}
                    onClick={closeCart}
                    className="h-28 w-20 shrink-0 overflow-hidden bg-sand"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate text-sm tracking-wide">{item.name}</p>
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
                    <div className="mt-auto flex items-center gap-3 pt-3">
                      <button
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center border border-border"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => setQuantity(item.id, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center border border-border"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border px-6 py-6">
            <div className="flex items-baseline justify-between">
              <span className="kicker">Subtotal</span>
              <span className="display text-2xl">{formatPrice(total, symbol)}</span>
            </div>
            {hasPendingPrices && (
              <p className="mt-2 text-xs text-muted-foreground">
                Some items are awaiting pricing — we&apos;ll confirm on WhatsApp.
              </p>
            )}
            <MagneticButton to="/cart" onClick={closeCart} className="mt-6 w-full">
              Review &amp; order
            </MagneticButton>
          </div>
        )}
      </aside>
    </>
  );
}
