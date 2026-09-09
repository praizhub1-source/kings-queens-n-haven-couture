import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useCart } from "@/lib/cart";
import { priceLabel, type Category, type Product } from "@/lib/store";
import { SmartImage } from "./SmartImage";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ProductCard({
  product,
  categories,
  symbol = "GH₵",
  className,
  priority = false,
}: {
  product: Product;
  categories?: Category[];
  symbol?: string;
  className?: string;
  /** True for cards visible on first paint (first row) — loads immediately. */
  priority?: boolean;
}) {
  const { add } = useCart();
  const category = categories?.find((c) => c.id === product.category_id);
  const image = product.images?.[0] ?? null;
  const secondary = product.images?.[1] ?? null;
  const [showSecondary, setShowSecondary] = useState(false);

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block overflow-hidden bg-sand"
        onPointerEnter={() => secondary && setShowSecondary(true)}
      >
        <div className="aspect-[3/4] w-full overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              decoding="async"
              sizes="(min-width: 768px) 25vw, 50vw"
              className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Image coming soon
            </div>
          )}
          {secondary && showSecondary && (
            <img
              src={secondary}
              alt=""
              loading="lazy"
              decoding="async"
              sizes="(min-width: 768px) 25vw, 50vw"
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            />
          )}
        </div>

        {!product.in_stock && (
          <span className="absolute left-4 top-4 bg-ink/85 px-3 py-1 text-[0.55rem] uppercase tracking-[0.28em] text-ivory">
            Sold out
          </span>
        )}
        {product.new_arrival && product.in_stock && (
          <span className="absolute left-4 top-4 bg-champagne px-3 py-1 text-[0.55rem] uppercase tracking-[0.28em] text-ink">
            New
          </span>
        )}
      </Link>

      <div className="flex items-start justify-between gap-4 pt-5">
        <div className="min-w-0">
          {category && <p className="kicker text-[0.55rem]">{category.name}</p>}
          <h3 className="mt-1 truncate font-sans text-sm tracking-wide text-ink">{product.name}</h3>
          <p
            className={cn(
              "mt-1 text-sm",
              product.price === null ? "text-muted-foreground italic" : "text-forest",
            )}
          >
            {priceLabel(product.price, symbol)}
          </p>
        </div>

        <button
          type="button"
          disabled={!product.in_stock}
          onClick={() => {
            add({
              id: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              image,
            });
            toast.success(`${product.name} added to bag`);
          }}
          aria-label={`Add ${product.name} to bag`}
          className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/20 text-ink transition-all duration-500 hover:border-forest hover:bg-forest hover:text-primary-foreground disabled:opacity-30"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
