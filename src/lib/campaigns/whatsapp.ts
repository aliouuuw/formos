/** wa.me needs the country code; a local Senegal mobile (9 digits, starts with 7) gets 221. */
export function whatsAppDigits(number: string): string {
  const digits = number.replace(/\D/g, '')
  return /^7\d{8}$/.test(digits) ? `221${digits}` : digits
}

export function campaignWhatsAppUrl(number: string | undefined, campaignShortName = 'IPO') {
  if (!number) return null
  const text = `Bonjour, je souhaite recevoir des informations sur l'${campaignShortName} via Everest Finance.`
  return `https://wa.me/${whatsAppDigits(number)}?text=${encodeURIComponent(text)}`
}
