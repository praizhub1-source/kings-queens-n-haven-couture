import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { queryOptions } from "@tanstack/react-query";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type StoreSettings = Database["public"]["Tables"]["store_settings"]["Row"];

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

export const settingsQuery = queryOptions({
  queryKey: ["store_settings"],
  queryFn: async (): Promise<StoreSettings | null> => {
    const { data, error } = await supabase.from("store_settings").select("*").limit(1).maybeSingle();
    if (error) throw error;
    return data;
  },
});

export function formatPrice(price: number | null, symbol = "GH₵") {
  if (price === null || price === undefined) return null;
  return `${symbol} ${Number(price).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function priceLabel(price: number | null, symbol = "GH₵") {
  return formatPrice(price, symbol) ?? "Price available soon";
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

/** Ghana local numbers (0XXXXXXXXX) become 233XXXXXXXXX for wa.me links. */
export function waNumber(raw: string | undefined | null) {
  const d = digitsOnly(raw ?? "0550545074");
  if (d.startsWith("233")) return d;
  if (d.startsWith("0")) return `233${d.slice(1)}`;
  return d;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}
