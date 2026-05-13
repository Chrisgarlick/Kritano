/**
 * Static list of disposable / throwaway email domains we refuse at lead-capture
 * forms (gated resources, in particular). Intentionally short and explicit:
 * we'd rather miss a few obscure providers than maintain a 200-entry list
 * that needs constant attention. Add domains here as we see them in the
 * captured-leads data.
 */

export const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  '10minutemail.com',
  '20minutemail.com',
  'discard.email',
  'dispostable.com',
  'fakeinbox.com',
  'getairmail.com',
  'getnada.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'inboxbear.com',
  'inboxkitten.com',
  'mailcatch.com',
  'mailinator.com',
  'mailnesia.com',
  'maildrop.cc',
  'mintemail.com',
  'mohmal.com',
  'mytemp.email',
  'sharklasers.com',
  'spam4.me',
  'tempail.com',
  'tempmail.com',
  'tempmail.net',
  'temp-mail.org',
  'throwawaymail.com',
  'trashmail.com',
  'trashmail.net',
  'yopmail.com',
]);

export function isDisposableEmail(email: string): boolean {
  const at = email.lastIndexOf('@');
  if (at === -1) return false;
  const domain = email.slice(at + 1).toLowerCase().trim();
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}
