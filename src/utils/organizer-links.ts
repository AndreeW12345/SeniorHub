/** Ensures a website URL has a protocol so Linking can open it. */
export function normalizeWebsiteUrl(url: string): string {
  const trimmed = url.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function getPhoneUrl(phone: string): string {
  return `tel:${phone.replace(/\s+/g, '')}`;
}

export function getEmailUrl(email: string): string {
  return `mailto:${email.trim()}`;
}
