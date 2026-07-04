export const PHONE_DISPLAY = '(717) 415-6171';
export const PHONE_E164 = '+17174156171';
export const PHONE_WA = '17174156171';
export const EMAIL = 'hello@zavinteriorclean.com';
export const INSTAGRAM = 'https://instagram.com/zavinteriorclean';

export function whatsappUrl(message: string) {
  return `https://wa.me/${PHONE_WA}?text=${encodeURIComponent(message)}`;
}
