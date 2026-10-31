import { Linking } from "react-native";

/** WhatsApp do suporte do Fominha (DDI + DDD + número, só dígitos). */
export const SUPPORT_WHATSAPP = "5598985856218";

export function supportWhatsAppUrl(message = "Olá! Preciso de ajuda com o app do entregador do Fominha."): string {
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

/** Abre a conversa com o suporte. `wa.me` cai no navegador se não houver WhatsApp. */
export function openSupport(message?: string): Promise<void> {
  return Linking.openURL(supportWhatsAppUrl(message));
}
