import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  src?: string | null;
  alt: string;
  /** Above-the-fold images load immediately with high fetch priority. */
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** Shown when there is no source or the image fails to load. */
  fallbackLabel?: string;
  ariaHidden?: boolean;
};

/**
 * Single image primitive for the storefront.
 * - Above-the-fold images load eagerly and concurrently (fetchPriority high).
 * - Below-the-fold images lazy-load with async decoding.
 * - Failed / missing images degrade to a quiet placeholder instead of a broken icon.
 */
export function SmartImage({
  src,
  alt,
  priority = false,
  sizes,
  className,
  fallbackLabel = "Image coming soon",
  ariaHidden,
}: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        aria-hidden={ariaHidden}
        className={cn(
          "flex h-full w-full items-center justify-center bg-sand text-[0.55rem] uppercase tracking-[0.28em] text-muted-foreground",
          className,
        )}
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={ariaHidden}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding={priority ? "sync" : "async"}
      {...(sizes ? { sizes } : {})}
      onError={() => setFailed(true)}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
