import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { categoriesQuery, priceLabel, productsQuery, settingsQuery } from "@/lib/store";
import { StoreLayout } from "@/components/site/StoreLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { Reveal } from "@/components/motion/Reveal";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — King's n Queens Haven Couture` },
      {
        name: "description",
        content: "View this piece from King's n Queens Haven Couture and order on WhatsApp.",
      },
      { property: "og:title", content: "King's n Queens Haven Couture" },
      {
        property: "og:description",
        content: "Curated fragrance and couture from Accra, Ghana.",
      },
    ],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const { data: products = [], isLoading } = useQuery(productsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: settings } = useQuery(settingsQuery);
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);

  const product = products.find((p) => p.slug === slug);
  const symbol = settings?.currency_symbol ?? "GH₵";

  if (isLoading) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-[1400px] px-5 pt-40 md:px-10">
          <div className="h-[60vh] animate-pulse bg-sand" />
        </div>
      </StoreLayout>
    );
  }

  if (!product) {
    return (
      <StoreLayout>
        <div className="mx-auto max-w-xl px-5 py-40 text-center">
          <h1 className="display text-4xl">Piece not found</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            This item may have been removed from the collection.
          </p>
          <MagneticButton to="/shop" className="mt-8" variant="outline">
            Back to shop
          </MagneticButton>
        </div>
      </StoreLayout>
    );
  }

  const category = categories.find((c) => c.id === product.category_id);
  const related = products
    .filter((p) => p.id !== product.id && p.category_id === product.category_id)
    .slice(0, 4);

  return (
    <StoreLayout>
      <section className="mx-auto max-w-[1400px] px-5 pb-24 pt-28 md:px-10 md:pt-40">
        <nav className="kicker mb-8 flex gap-2">
          <Link to="/shop" className="link-underline">
            Shop
          </Link>
          <span>/</span>
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <div className="aspect-[4/5] overflow-hidden bg-sand">
              {product.images?.[active] ? (
                <img
                  src={product.images[active]}
                  alt={product.name}
                  fetchPriority="high"
                  decoding="async"
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center kicker">Image coming soon</div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => setActive(i)}
                    className={cn(
                      "h-20 w-16 overflow-hidden border",
                      i === active ? "border-forest" : "border-transparent",
                    )}
                  >
                    <img src={img} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="md:pt-6">
            {category && <p className="kicker">{category.name}</p>}
            <h1 className="mt-3 text-4xl leading-tight md:text-6xl">{product.name}</h1>
            <p
              className={cn(
                "mt-5 text-xl",
                product.price === null ? "italic text-muted-foreground" : "text-forest",
              )}
            >
              {priceLabel(product.price, symbol)}
            </p>

            <p className="mt-8 max-w-lg text-sm leading-loose text-muted-foreground">
              {product.description ?? "Full description coming soon. Ask us on WhatsApp for details."}
            </p>

            <p className="mt-6 text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
              {product.in_stock ? "Available" : "Currently unavailable"}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <div className="flex items-center border border-border">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-12 w-12 items-center justify-center"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="flex h-12 w-12 items-center justify-center"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <MagneticButton
                disabled={!product.in_stock}
                onClick={() => {
                  add(
                    {
                      id: product.id,
                      slug: product.slug,
                      name: product.name,
                      price: product.price,
                      image: product.images?.[0] ?? null,
                    },
                    qty,
                  );
                  toast.success(`${product.name} added to bag`);
                }}
              >
                Add to bag
              </MagneticButton>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-32">
            <Reveal>
              <p className="kicker">You may also like</p>
            </Reveal>
            <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} categories={categories} symbol={symbol} />
              ))}
            </div>
          </div>
        )}
      </section>
    </StoreLayout>
  );
}
