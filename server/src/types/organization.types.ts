// Minimal organization types needed by domain-verification service

export interface OrganizationDomain {
  id: string;
  organization_id: string;
  domain: string;
  include_subdomains: boolean;
  verified: boolean;
  verification_token: string | null;
  verified_at: Date | null;
  status: string;
  locked_until: Date | null;
  pending_domain: string | null;
  added_by: string | null;
  created_at: Date;
  updated_at: Date;
  verification_method: string | null;
  verification_attempts: number;
  last_verification_attempt: Date | null;
  ignore_robots_txt: boolean;
  rate_limit_profile: string | null;
  send_verification_header: boolean;
}
