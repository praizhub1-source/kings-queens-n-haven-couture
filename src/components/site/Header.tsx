import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const { count, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-700",
        scrolled ? "bg-background/85 backdrop-blur-xl border-b border-border/60" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 md:h-20 md:px-10">
        <button
          className="flex items-center gap-2 text-ink md:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="link-underline text-[0.68rem] uppercase tracking-[0.3em] text-ink/80 transition-colors hover:text-ink"
              activeProps={{ "data-active": "true" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Link to="/" className="absolute left-1/2 -translate-x-1/2 text-center">
          <span className="display block text-base leading-none tracking-[0.18em] md:text-xl">
            KING&apos;S N QUEENS
          </span>
          <span className="kicker mt-1 block text-[0.5rem] md:text-[0.58rem]">Haven Couture</span>
        </Link>

        <button
          onClick={openCart}
          className="relative flex items-center gap-2 text-ink transition-opacity hover:opacity-70"
          aria-label="Open cart"
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="hidden text-[0.68rem] uppercase tracking-[0.3em] md:inline">Bag</span>
          {count > 0 && (
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-forest px-1 text-[0.55rem] font-medium text-primary-foreground md:-right-3">
              {count}
            </span>
          )}
        </button>
      </div>

      {/* mobile overlay menu */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex flex-col bg-background transition-[opacity,transform] duration-500 md:hidden",
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <span className="kicker">Menu</span>
          <button onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col justify-center gap-2 px-8">
          {links.map((l, i) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              style={{ transitionDelay: `${i * 60}ms` }}
              className="display border-b border-border/60 py-5 text-4xl tracking-tight text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
