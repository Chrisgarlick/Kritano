-- Add E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) analysis columns
ALTER TABLE audit_pages
  ADD COLUMN IF NOT EXISTS eeat_score INT,
  ADD COLUMN IF NOT EXISTS eeat_experience_score INT,
  ADD COLUMN IF NOT EXISTS eeat_expertise_score INT,
  ADD COLUMN IF NOT EXISTS eeat_authoritativeness_score INT,
  ADD COLUMN IF NOT EXISTS eeat_trustworthiness_score INT,
  ADD COLUMN IF NOT EXISTS has_author_bio BOOLEAN,
  ADD COLUMN IF NOT EXISTS has_author_credentials BOOLEAN,
  ADD COLUMN IF NOT EXISTS citation_count INT,
  ADD COLUMN IF NOT EXISTS has_contact_info BOOLEAN,
  ADD COLUMN IF NOT EXISTS has_privacy_policy BOOLEAN,
  ADD COLUMN IF NOT EXISTS has_terms_of_service BOOLEAN,
  ADD COLUMN IF NOT EXISTS eeat_tier TEXT;
