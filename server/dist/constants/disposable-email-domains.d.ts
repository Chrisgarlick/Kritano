/**
 * Static list of disposable / throwaway email domains we refuse at lead-capture
 * forms (gated resources, in particular). Intentionally short and explicit:
 * we'd rather miss a few obscure providers than maintain a 200-entry list
 * that needs constant attention. Add domains here as we see them in the
 * captured-leads data.
 */
export declare const DISPOSABLE_EMAIL_DOMAINS: Set<string>;
export declare function isDisposableEmail(email: string): boolean;
//# sourceMappingURL=disposable-email-domains.d.ts.map