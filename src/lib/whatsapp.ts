export function whatsappUrl(phone: string | null | undefined, message: string) {
  if (!phone) return "#";
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}