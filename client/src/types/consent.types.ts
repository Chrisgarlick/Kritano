export interface CookieConsent {
  version: string;
  categories: {
    necessary: true;
    analytics: boolean;
    marketing: boolean;
  };
  action: 'accept_all' | 'reject_all' | 'custom' | 'withdraw';
  timestamp: string;
}

export type CookieCategory = 'necessary' | 'analytics' | 'marketing';

export interface CookieCategoryInfo {
  label: string;
  description: string;
  required: boolean;
  cookies: string[];
}
