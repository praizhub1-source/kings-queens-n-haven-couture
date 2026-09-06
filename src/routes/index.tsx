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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "preload",
        as: "image",
        href: "https://files.catbox.moe/a2e9g6.jpg",
        fetchPriority: "high",
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
      {/* Full-bleed fragrance campaign */}
      <section className="relative flex min-h-[100svh] w-full items-end overflow-hidden bg-forest-deep pb-14 pt-28 md:pb-20 md:pt-32">
        {heroImage && !heroIsVideo && (
          <img
            src={heroImage}
            alt={heroProduct?.name ?? "Grandior Solaire fragrance"}
            fetchPriority="high"
            loading="eager"
            decoding="async"
            sizes="100vw"
            className="absolute inset-0 h-full w-full scale-[1.035] object-cover object-[58%_center] motion-safe:animate-[kq-hero-in_1.8s_cubic-bezier(0.22,1,0.36,1)_both] md:object-[64%_48%]"
          />
        )}
        {heroIsVideo && settings?.hero_media_url && (
          <video
            className="absolute inset-0 h-full w-full object-cover object-center"
            src={settings.hero_media_url}
            poster={settings.hero_poster_url ?? undefined}
            preload="metadata"
            autoPlay
            muted
            loop
            playsInline
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-forest-deep via-forest-deep/70 to-transparent md:via-forest-deep/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-ink/35" />
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-ivory/10 to-transparent" />

        <div className="relative mx-auto w-full max-w-[1400px] px-5 md:px-10">
          <div className="max-w-[760px]">
            <p className="kicker animate-rise overflow-hidden text-champagne">
              Accra · Ghana — The Fragrance House
            </p>
            <h1 className="mt-5 text-ivory">
              <span className="animate-rise block text-[3.35rem] leading-[0.84] sm:text-7xl md:text-[7rem]" style={{ animationDelay: "100ms" }}>
                {settings?.hero_headline ?? "KING'S N QUEENS"}
              </span>
              <span className="animate-rise mt-2 block text-[3.15rem] leading-[0.84] text-champagne sm:text-7xl md:text-[6.5rem]" style={{ animationDelay: "220ms" }}>
                {settings?.hero_subheadline ?? "HAVEN COUTURE"}
              </span>
            </h1>
            <p className="animate-rise mt-7 max-w-md text-sm leading-relaxed text-ivory/80" style={{ animationDelay: "320ms" }}>
              {settings?.hero_tagline ?? "Your style. Your scent. Your presence."}
            </p>
            <div className="animate-rise mt-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center" style={{ animationDelay: "400ms" }}>
              <MagneticButton to={settings?.hero_cta_link ?? "/shop"} variant="light">
                {settings?.hero_cta_label ?? "Explore Collection"}
              </MagneticButton>
              {heroProduct && (
                <Link
                  to="/product/$slug"
                  params={{ slug: heroProduct.slug }}
                  className="link-underline text-[0.68rem] uppercase tracking-[0.28em] text-ivory/80"
                >
                  Discover {heroProduct.name}
                </Link>
              )}
            </div>
          </div>
          <div className="mt-12 flex items-center justify-between border-t border-ivory/20 pt-4 text-ivory/60">
            <span className="text-[0.58rem] uppercase tracking-[0.28em]">Signature fragrance</span>
            <span className="hidden text-[0.58rem] uppercase tracking-[0.28em] sm:block">Scroll to discover</span>
          </div>
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
                        decoding="async"
                        sizes="(min-width: 768px) 33vw, 100vw"
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
                      decoding="async"
                      sizes="(min-width: 768px) 28vw, 72vw"
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
                decoding="async"
                sizes="(min-width: 768px) 50vw, 100vw"
                className="h-full w-full object-cover"
              />
            )}
          </Reveal>
        </div>
      </section>
    </StoreLayout>
  );
}
