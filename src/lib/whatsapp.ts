import type { CartItem } from "./cart";
import { formatPrice, waNumber } from "./store";

export type OrderDetails = {
  name: string;
  phone: string;
  location: string;
  note?: string;
};

export function buildOrderMessage({
  businessName,
  items,
  details,
  symbol,
}: {
  businessName: string;
  items: CartItem[];
  details: OrderDetails;
  symbol: string;
}) {
  const lines: string[] = [];
  lines.push(`*NEW ORDER — ${businessName}*`);
  lines.push("");
  lines.push(`*Name:* ${details.name}`);
  lines.push(`*Phone:* ${details.phone}`);
  lines.push(`*Delivery:* ${details.location}`);
  if (details.note?.trim()) lines.push(`*Note:* ${details.note.trim()}`);
  lines.push("");
  lines.push("*Items*");

  items.forEach((item, index) => {
    const unit = formatPrice(item.price, symbol);
    const line = unit
      ? `${index + 1}. ${item.name} × ${item.quantity} — ${formatPrice((item.price ?? 0) * item.quantity, symbol)}`
      : `${index + 1}. ${item.name} × ${item.quantity} — price pending`;
    lines.push(line);
  });

  const priced = items.filter((i) => i.price !== null && i.price !== undefined);
  const total = priced.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0);
  const pending = items.length - priced.length;

  lines.push("");
  if (priced.length > 0) {
    lines.push(`*Total (priced items):* ${formatPrice(total, symbol)}`);
  }
  if (pending > 0) {
    lines.push(`_${pending} item(s) awaiting price confirmation._`);
  }
  lines.push("");
  lines.push("Please confirm availability and delivery. Thank you.");

  return lines.join("\n");
}

export function waLink(number: string | null | undefined, message: string) {
  return `https://wa.me/${waNumber(number)}?text=${encodeURIComponent(message)}`;
}
