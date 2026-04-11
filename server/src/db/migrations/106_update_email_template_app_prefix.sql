-- Update seeded email template URLs to use /app/ prefix for frontend app routes
-- The URLs are stored in the `blocks` JSONB column

UPDATE email_templates
SET blocks = REPLACE(blocks::text, '{{appUrl}}/audits', '{{appUrl}}/app/audits')::jsonb
WHERE blocks::text LIKE '%{{appUrl}}/audits%'
  AND blocks::text NOT LIKE '%{{appUrl}}/app/audits%';

UPDATE email_templates
SET blocks = REPLACE(blocks::text, '{{appUrl}}/settings', '{{appUrl}}/app/settings')::jsonb
WHERE blocks::text LIKE '%{{appUrl}}/settings%'
  AND blocks::text NOT LIKE '%{{appUrl}}/app/settings%';

UPDATE email_templates
SET blocks = REPLACE(blocks::text, '{{appUrl}}/sites', '{{appUrl}}/app/sites')::jsonb
WHERE blocks::text LIKE '%{{appUrl}}/sites%'
  AND blocks::text NOT LIKE '%{{appUrl}}/app/sites%';

UPDATE email_templates
SET blocks = REPLACE(blocks::text, '{{appUrl}}/dashboard', '{{appUrl}}/app/dashboard')::jsonb
WHERE blocks::text LIKE '%{{appUrl}}/dashboard%'
  AND blocks::text NOT LIKE '%{{appUrl}}/app/dashboard%';

UPDATE email_templates
SET blocks = REPLACE(blocks::text, '{{appUrl}}/referrals', '{{appUrl}}/app/referrals')::jsonb
WHERE blocks::text LIKE '%{{appUrl}}/referrals%'
  AND blocks::text NOT LIKE '%{{appUrl}}/app/referrals%';
