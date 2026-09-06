import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { productsQuery, settingsQuery } from "@/lib/store";
import { StoreLayout } from "@/components/site/StoreLayout";
import { Reveal } from "@/components/motion/Reveal";
import { MagneticButton } from "@/components/motion/MagneticButton";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — King's n Queens Haven Couture" },
      {
        name: "description",
        content:
          "The story behind King's n Queens Haven Couture, a Ghanaian house of fragrance and couture.",
      },
      { property: "og:title", content: "Our Story — King's n Queens Haven Couture" },
      {
        property: "og:description",
        content: "A Ghanaian house of fragrance and couture, curated with intention.",
      },
    ],
  }),
  component: About,
});

function About() {
  const { data: settings } = useQuery(settingsQuery);
  const { data: products = [] } = useQuery(productsQuery);
  const cover = products.find((p) => p.images?.[0])?.images?.[0];

  return (
    <StoreLayout>
      <section className="mx-auto max-w-[1400px] px-5 pb-28 pt-32 md:px-10 md:pt-44">
        <Reveal>
          <p className="kicker">Our story</p>
          <h1 className="mt-4 max-w-4xl text-5xl leading-[1.02] md:text-8xl">
            {settings?.about_title ?? "The Haven"}
          </h1>
        </Reveal>

        <div className="mt-16 grid gap-14 md:grid-cols-2">
          <Reveal className="aspect-[4/5] overflow-hidden bg-sand">
            {cover && <img src={cover} alt="" loading="lazy" decoding="async" sizes="(min-width: 768px) 50vw, 100vw" className="h-full w-full object-cover" />}
          </Reveal>
          <Reveal delay={120} className="md:pt-10">
            <p className="text-base leading-loose text-muted-foreground">{settings?.about_body}</p>
            <div className="mt-10">
              <MagneticButton to="/shop" variant="outline">
                Explore the collection
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>
    </StoreLayout>
  );
}
