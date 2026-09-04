import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { categoriesQuery, productsQuery, settingsQuery } from "@/lib/store";
import { StoreLayout } from "@/components/site/StoreLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

type ShopSearch = { category?: string };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    category: typeof search["category"] === "string" ? search["category"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop the Collection — King's n Queens Haven Couture" },
      {
        name: "description",
        content:
          "Browse fragrances, footwear and tailored pieces. Add to bag and order on WhatsApp.",
      },
      { property: "og:title", content: "Shop — King's n Queens Haven Couture" },
      {
        property: "og:description",
        content: "Fragrances, footwear and couture pieces curated in Accra.",
      },
    ],
  }),
  component: Shop,
});

const sorts = [
  { key: "curated", label: "Curated" },
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price ↑" },
  { key: "price-desc", label: "Price ↓" },
] as const;

function Shop() {
  const { category } = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { data: products = [], isLoading } = useQuery(productsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: settings } = useQuery(settingsQuery);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<(typeof sorts)[number]["key"]>("curated");

  const activeCat = categories.find((c) => c.slug === category);

  const list = useMemo(() => {
    let out = products;
    if (activeCat) out = out.filter((p) => p.category_id === activeCat.id);
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q),
      );
    }
    const sorted = [...out];
    if (sort === "newest")
      sorted.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    if (sort === "price-asc") sorted.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sort === "price-desc") sorted.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    return sorted;
  }, [products, activeCat, query, sort]);

  return (
    <StoreLayout>
      <section className="mx-auto max-w-[1400px] px-5 pb-24 pt-32 md:px-10 md:pb-32 md:pt-44">
        <Reveal>
          <p className="kicker">The collection</p>
          <h1 className="mt-3 text-5xl md:text-7xl">{activeCat?.name ?? "Shop all"}</h1>
        </Reveal>

        <div className="mt-12 flex flex-col gap-6 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
          <div className="hide-scrollbar flex gap-2 overflow-x-auto">
            <button
              onClick={() => navigate({ search: {} })}
              className={cn(
                "shrink-0 rounded-full border px-5 py-2 text-[0.65rem] uppercase tracking-[0.22em] transition-colors",
                !activeCat ? "border-forest bg-forest text-primary-foreground" : "border-border",
              )}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate({ search: { category: c.slug } })}
                className={cn(
                  "shrink-0 rounded-full border px-5 py-2 text-[0.65rem] uppercase tracking-[0.22em] transition-colors",
                  activeCat?.id === c.id
                    ? "border-forest bg-forest text-primary-foreground"
                    : "border-border",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border-b border-border pb-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                maxLength={80}
                className="w-32 bg-transparent text-sm outline-none placeholder:text-muted-foreground md:w-40"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="bg-transparent text-[0.65rem] uppercase tracking-[0.22em] outline-none"
            >
              {sorts.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-16 grid grid-cols-2 gap-5 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse bg-sand" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="mt-20 text-center text-sm text-muted-foreground">
            No pieces match this selection yet.
          </p>
        ) : (
          <div className="mt-14 grid grid-cols-2 gap-x-5 gap-y-14 md:grid-cols-4">
            {list.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 70}>
                <ProductCard
                  product={p}
                  categories={categories}
                  symbol={settings?.currency_symbol ?? "GH₵"}
                />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </StoreLayout>
  );
}
