import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { categoriesQuery, priceLabel, productsQuery, settingsQuery } from "@/lib/store";
import { StoreLayout } from "@/components/site/StoreLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/motion/Reveal";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { waLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "King's n Queens Haven Couture — Fragrance & Couture in Accra" },
      {
        name: "description",
        content:
          "A Ghanaian boutique of signature fragrances, statement footwear and tailored pieces. Order directly on WhatsApp.",
      },
      { property: "og:title", content: "King's n Queens Haven Couture" },
      {
        property: "og:description",
        content: "Your style. Your scent. Your presence. Curated couture and fragrance in Accra.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: settings } = useQuery(settingsQuery);
  const { data: products = [] } = useQuery(productsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);

  const symbol = settings?.currency_symbol ?? "GH₵";
  const featured = products.filter((p) => p.featured).slice(0, 8);
  const arrivals = products.filter((p) => p.new_arrival).slice(0, 6);

  const fragranceCategoryIds = categories
    .filter((c) => /fragran|perfume|scent/i.test(`${c.slug} ${c.name}`))
    .map((c) => c.id);
  const fragrances = products.filter((p) =>
    p.category_id ? fragranceCategoryIds.includes(p.category_id) : false,
  );
  const preferred = [
    "grandior",
    "nitro",
    "amber-oud",
    "borouj-amnesty",
    "hawas-ice",
  ];
  const heroProduct =
    preferred.map((key) => fragrances.find((p) => p.slug.includes(key))).find(Boolean) ??
    fragrances[0] ??
    products[0];
  const heroImage = settings?.hero_media_url ?? heroProduct?.images?.[0] ?? null;
  const heroIsVideo = Boolean(settings?.hero_media_url) && settings?.hero_media_type === "video";
  const editorial = fragrances.length > 0 ? fragrances.slice(0, 6) : products.slice(0, 5);


  return (
    <StoreLayout>
      {/* HERO */}
      <section className="relative flex min-h-dvh w-full items-center overflow-hidden bg-forest-deep pb-16 pt-28 md:pb-24 md:pt-32">
        {/* ambient atmosphere from the fragrance itself */}
        {heroImage && !heroIsVideo && (
          <img
            src={heroImage}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-25 blur-2xl"
          />
        )}
        {heroIsVideo && settings?.hero_media_url && (
          <video
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
            src={settings.hero_media_url}
            poster={settings.hero_poster_url ?? undefined}
            autoPlay
            muted
            loop
            playsInline
          />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_20%_20%,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest-deep/70 to-forest-deep/85" />

        <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-12 px-5 md:grid-cols-[1.05fr_0.95fr] md:gap-16 md:px-10">
          <div>
            <p className="kicker overflow-hidden text-champagne">
              <span className="animate-rise block">Accra · Ghana — The Fragrance House</span>
            </p>
            <h1 className="mt-5 text-ivory">
              <span className="block overflow-hidden">
                <span
                  className="animate-rise block text-[13vw] leading-[0.9] tracking-tight md:text-[5.4vw]"
                  style={{ animationDelay: "120ms" }}
                >
                  {settings?.hero_headline ?? "KING'S N QUEENS"}
                </span>
              </span>
              <span className="block overflow-hidden">
                <span
                  className="animate-rise block text-[13vw] leading-[0.9] tracking-tight text-champagne md:text-[5.4vw]"
                  style={{ animationDelay: "260ms" }}
                >
                  {settings?.hero_subheadline ?? "HAVEN COUTURE"}
                </span>
              </span>
            </h1>
            <p className="mt-8 max-w-md text-sm leading-relaxed text-ivory/75">
              {settings?.hero_tagline ?? "Your style. Your scent. Your presence."}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <MagneticButton to={settings?.hero_cta_link ?? "/shop"} variant="light">
                {settings?.hero_cta_label ?? "Explore Collection"}
              </MagneticButton>
              {heroProduct && (
                <Link
                  to="/product/$slug"
                  params={{ slug: heroProduct.slug }}
                  className="link-underline text-[0.68rem] uppercase tracking-[0.28em] text-ivory/70"
                >
                  Discover {heroProduct.name}
                </Link>
              )}
            </div>
          </div>

          {/* Editorial fragrance plinth */}
          {heroImage && !heroIsVideo && (
            <div className="animate-rise relative" style={{ animationDelay: "380ms" }}>
              <div className="absolute -inset-6 rounded-[999px] bg-champagne/10 blur-3xl md:-inset-10" />
              <div className="relative mx-auto aspect-[4/5] w-full max-w-[440px] overflow-hidden border border-ivory/15 bg-gradient-to-b from-ivory/10 to-transparent">
                <img
                  src={heroImage}
                  alt={heroProduct?.name ?? "Signature fragrance"}
                  className="h-full w-full object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-forest-deep/90 to-transparent p-5">
                  <div>
                    <p className="text-[0.6rem] uppercase tracking-[0.3em] text-champagne">
                      The signature
                    </p>
                    <p className="mt-1 text-lg text-ivory">
                      {heroProduct?.name ?? "Signature fragrance"}
                    </p>
                  </div>
                  <span className="hidden text-[0.6rem] uppercase tracking-[0.24em] text-ivory/60 sm:block">
                    Eau de parfum
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* MARQUEE STATEMENT */}
      <section className="overflow-hidden border-y border-border bg-sand py-6">
        <div className="marquee-track">
          {[0, 1].map((k) => (
            <span key={k} className="display flex shrink-0 items-center gap-10 pr-10 text-2xl md:text-4xl">
              <span>YOUR STYLE.</span>
              <span className="text-champagne">✦</span>
              <span>YOUR SCENT.</span>
              <span className="text-champagne">✦</span>
              <span>YOUR PRESENCE.</span>
              <span className="text-champagne">✦</span>
            </span>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-5 py-24 md:px-10 md:py-32">
          <Reveal>
            <p className="kicker">Shop by</p>
            <h2 className="mt-3 text-4xl md:text-6xl">The categories</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {categories.map((cat, i) => {
              const cover =
                cat.image_url ?? products.find((p) => p.category_id === cat.id)?.images?.[0];
              return (
                <Reveal key={cat.id} delay={i * 90}>
                  <Link
                    to="/shop"
                    search={{ category: cat.slug }}
                    className="group relative block aspect-[4/5] overflow-hidden bg-sand"
                  >
                    {cover && (
                      <img
                        src={cover}
                        alt={cat.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-7 text-ivory">
                      <h3 className="text-3xl">{cat.name}</h3>
                      {cat.description && (
                        <p className="mt-2 max-w-xs text-xs text-ivory/70">{cat.description}</p>
                      )}
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {/* FEATURED */}
      <section className="border-t border-border bg-card px-5 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="kicker">Selected</p>
              <h2 className="mt-3 text-4xl md:text-6xl">Featured pieces</h2>
            </div>
            <Link to="/shop" className="link-underline kicker">
              View all
            </Link>
          </Reveal>

          {featured.length === 0 ? (
            <p className="mt-12 text-sm text-muted-foreground">
              Featured pieces will appear here once selected in the admin panel.
            </p>
          ) : (
            <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4">
              {featured.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 80}>
                  <ProductCard product={p} categories={categories} symbol={symbol} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* EDITORIAL HORIZONTAL */}
      {editorial.length > 0 && (
        <section className="py-24 md:py-32">
          <div className="mx-auto max-w-[1400px] px-5 md:px-10">
            <Reveal>
              <p className="kicker">The fragrance edit</p>
              <h2 className="mt-3 max-w-2xl text-4xl leading-tight md:text-6xl">
                A scent is the first thing they remember about you.
              </h2>
            </Reveal>
          </div>
          <div className="hide-scrollbar mt-12 flex gap-5 overflow-x-auto px-5 pb-4 md:px-10">
            {editorial.map((p) => (
              <Link
                key={p.id}
                to="/product/$slug"
                params={{ slug: p.slug }}
                className="group w-[72vw] shrink-0 md:w-[28vw]"
              >
                <div className="aspect-[4/5] overflow-hidden bg-sand">
                  {p.images?.[0] && (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                    />
                  )}
                </div>
                <p className="mt-4 text-sm tracking-wide">{p.name}</p>
                <p className="text-sm text-muted-foreground">{priceLabel(p.price, symbol)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* NEW ARRIVALS */}
      {arrivals.length > 0 && (
        <section className="border-y border-border bg-sand/50 px-5 py-24 md:px-10 md:py-32">
          <div className="mx-auto max-w-[1400px]">
            <Reveal>
              <p className="kicker">Just in</p>
              <h2 className="mt-3 text-4xl md:text-6xl">New arrivals</h2>
            </Reveal>
            <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3">
              {arrivals.map((p, i) => (
                <Reveal key={p.id} delay={(i % 3) * 90}>
                  <ProductCard product={p} categories={categories} symbol={symbol} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ABOUT + WHATSAPP */}
      <section className="mx-auto max-w-[1400px] px-5 py-24 md:px-10 md:py-32">
        <div className="grid items-center gap-14 md:grid-cols-2">
          <Reveal>
            <p className="kicker">The house</p>
            <h2 className="mt-3 text-4xl md:text-5xl">{settings?.about_title ?? "The Haven"}</h2>
            <p className="mt-6 max-w-lg text-sm leading-loose text-muted-foreground">
              {settings?.about_body}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <MagneticButton to="/about" variant="outline">
                Our story
              </MagneticButton>
              <MagneticButton
                href={waLink(
                  settings?.whatsapp_number,
                  `Hello ${settings?.business_name ?? "King's n Queens Haven Couture"}, I'd like to order.`,
                )}
              >
                Order on WhatsApp
              </MagneticButton>
            </div>
          </Reveal>
          <Reveal delay={120} className="aspect-[4/5] overflow-hidden bg-sand">
            {editorial[1]?.images?.[0] && (
              <img
                src={editorial[1].images[0]}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            )}
          </Reveal>
        </div>
      </section>
    </StoreLayout>
  );
}
