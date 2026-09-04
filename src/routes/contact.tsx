import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/store";
import { StoreLayout } from "@/components/site/StoreLayout";
import { Reveal } from "@/components/motion/Reveal";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { waLink } from "@/lib/whatsapp";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — King's n Queens Haven Couture" },
      {
        name: "description",
        content: "Reach King's n Queens Haven Couture on WhatsApp or by phone for orders and enquiries.",
      },
      { property: "og:title", content: "Contact — King's n Queens Haven Couture" },
      { property: "og:description", content: "Talk to us on WhatsApp or call for orders." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { data: settings } = useQuery(settingsQuery);

  return (
    <StoreLayout>
      <section className="mx-auto max-w-[1400px] px-5 pb-28 pt-32 md:px-10 md:pt-44">
        <Reveal>
          <p className="kicker">Get in touch</p>
          <h1 className="mt-4 text-5xl leading-[1.02] md:text-8xl">Let&apos;s talk</h1>
        </Reveal>

        <div className="mt-16 grid gap-10 md:grid-cols-3">
          <Reveal className="border-t border-border pt-6">
            <p className="kicker">WhatsApp</p>
            <p className="mt-3 text-2xl">{settings?.whatsapp_number ?? "0550545074"}</p>
            <MagneticButton
              className="mt-6"
              href={waLink(
                settings?.whatsapp_number,
                `Hello ${settings?.business_name ?? "King's n Queens Haven Couture"},`,
              )}
            >
              Message us
            </MagneticButton>
          </Reveal>

          <Reveal delay={100} className="border-t border-border pt-6">
            <p className="kicker">Phone</p>
            <p className="mt-3 text-2xl">{settings?.phone_number ?? "0207114171"}</p>
            <MagneticButton
              className="mt-6"
              variant="outline"
              href={`tel:${settings?.phone_number ?? "0207114171"}`}
            >
              Call us
            </MagneticButton>
          </Reveal>

          <Reveal delay={200} className="border-t border-border pt-6">
            <p className="kicker">Location</p>
            <p className="mt-3 text-2xl">{settings?.address ?? "Accra, Ghana"}</p>
            {settings?.email && (
              <p className="mt-3 text-sm text-muted-foreground">{settings.email}</p>
            )}
          </Reveal>
        </div>
      </section>
    </StoreLayout>
  );
}
