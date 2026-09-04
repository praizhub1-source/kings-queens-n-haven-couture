import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/store";
import { waLink } from "@/lib/whatsapp";

export function Footer() {
  const { data: settings } = useQuery(settingsQuery);
  const year = new Date().getFullYear();

  return (
    <footer className="bg-forest-deep text-ivory">
      <div className="mx-auto max-w-[1400px] px-5 py-20 md:px-10 md:py-28">
        <div className="grid gap-14 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <h2 className="display text-3xl leading-tight md:text-5xl">
              King&apos;s n Queens
              <br />
              <span className="text-champagne">Haven Couture</span>
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-ivory/70">
              Your style. Your scent. Your presence.
            </p>
          </div>

          <div>
            <p className="kicker text-ivory/50">Explore</p>
            <ul className="mt-5 space-y-3 text-sm text-ivory/80">
              <li>
                <Link to="/shop" className="link-underline">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/about" className="link-underline">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="link-underline">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/policies" className="link-underline">
                  Store policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="kicker text-ivory/50">Reach us</p>
            <ul className="mt-5 space-y-3 text-sm text-ivory/80">
              <li>
                <a
                  className="link-underline"
                  href={waLink(settings?.whatsapp_number, "Hello King's n Queens Haven Couture,")}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp {settings?.whatsapp_number ?? "0550545074"}
                </a>
              </li>
              <li>
                <a className="link-underline" href={`tel:${settings?.phone_number ?? "0207114171"}`}>
                  Call {settings?.phone_number ?? "0207114171"}
                </a>
              </li>
              {settings?.address && <li className="text-ivory/60">{settings.address}</li>}
            </ul>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-3 border-t border-ivory/15 pt-8 text-[0.65rem] uppercase tracking-[0.24em] text-ivory/45 md:flex-row md:items-center md:justify-between">
          <span>
            © {year} {settings?.business_name ?? "King's n Queens Haven Couture"}
          </span>
          <span>Accra · Ghana</span>
        </div>
      </div>
    </footer>
  );
}
