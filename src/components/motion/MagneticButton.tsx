import { useRef, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  to?: string;
  href?: string;
  onClick?: () => void;
  variant?: "solid" | "outline" | "light";
  type?: "button" | "submit";
  disabled?: boolean;
};

const base =
  "group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full px-8 py-4 text-[0.72rem] uppercase tracking-[0.28em] transition-[transform,color,background-color,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:opacity-50";

const variants = {
  solid: "bg-forest text-primary-foreground hover:bg-forest-deep",
  outline: "border border-ink/25 text-ink hover:border-forest hover:text-forest",
  light: "border border-ivory/40 text-ivory hover:bg-ivory hover:text-ink",
};

export function MagneticButton({
  children,
  className,
  to,
  href,
  onClick,
  variant = "solid",
  type = "button",
  disabled,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  const handleMove = (e: React.MouseEvent) => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;
    const rect = node.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) * 0.22;
    const y = (e.clientY - (rect.top + rect.height / 2)) * 0.32;
    node.style.transform = `translate(${x}px, ${y}px)`;
  };

  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  const props = {
    ref: ref as never,
    className: cn(base, variants[variant], className),
    onMouseMove: handleMove,
    onMouseLeave: handleLeave,
  };

  const inner = <span className="relative z-10">{children}</span>;

  if (to) {
    return (
      <Link {...props} to={to} onClick={onClick}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a {...props} href={href} target="_blank" rel="noreferrer" onClick={onClick}>
        {inner}
      </a>
    );
  }
  return (
    <button {...props} type={type} onClick={onClick} disabled={disabled}>
      {inner}
    </button>
  );
}
