import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/store";
import { StoreLayout } from "@/components/site/StoreLayout";

export const Route = createFileRoute("/policies")({
  head: () => ({
    meta: [
      { title: "Store Policy — King's n Queens Haven Couture" },
      {
        name: "description",
        content: "Ordering, delivery and exchange information for King's n Queens Haven Couture.",
      },
      { property: "og:title", content: "Store Policy — King's n Queens Haven Couture" },
      { property: "og:description", content: "Ordering, delivery and exchange information." },
    ],
  }),
  component: Policies,
});

function Policies() {
  const { data: settings } = useQuery(settingsQuery);

  return (
    <StoreLayout>
      <section className="mx-auto max-w-3xl px-5 pb-28 pt-32 md:pt-44">
        <p className="kicker">Store policy</p>
        <h1 className="mt-4 text-4xl md:text-6xl">Ordering &amp; delivery</h1>
        <p className="mt-10 whitespace-pre-line text-sm leading-loose text-muted-foreground">
          {settings?.policy_body ?? "Policy details will be published here shortly."}
        </p>
      </section>
    </StoreLayout>
  );
}
