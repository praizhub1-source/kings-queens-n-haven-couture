import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { settingsQuery } from "@/lib/store";
import { waLink } from "@/lib/whatsapp";

export function WhatsAppFab() {
  const { data: settings } = useQuery(settingsQuery);
  const name = settings?.business_name ?? "King's n Queens Haven Couture";

  return (
    <a
      href={waLink(settings?.whatsapp_number, `Hello ${name}, I'd like to make an enquiry.`)}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 left-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-forest text-primary-foreground shadow-lg transition-transform duration-500 hover:scale-110"
    >
      <MessageCircle className="h-5 w-5" />
    </a>
  );
}
