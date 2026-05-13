-- Migration: 116_add_resource_toc.sql
-- Adds a "Contents" section to four of the long-form resource source MD files
-- so the PDF carries a real table of contents on its own page (typeset
-- page-breaks before every H2). The WCAG one-pager is intentionally skipped.
-- Each row's content_hash is bumped to match the updated source file, which
-- invalidates the on-disk PDF cache and forces a fresh typeset render on the
-- next download.

UPDATE gated_resources SET
  content_hash = 'cc2718717ad6bd7bfdf47dbc98630688d48422ec59e1318004cc1257f9ba6084',
  updated_at = NOW()
WHERE slug = 'website-health-checklist';

UPDATE gated_resources SET
  content_hash = 'c37af42b5ae03d6596ce2640133dde71970be7fa04d48f34e43abe0ae3e1fa97',
  updated_at = NOW()
WHERE slug = 'eaa-compliance-guide';

UPDATE gated_resources SET
  content_hash = '460d165b347dd5302fd20f5dc24cd4158ca86459818b9d42ae906c0657d1caa3',
  updated_at = NOW()
WHERE slug = 'aeo-optimisation-guide';

UPDATE gated_resources SET
  content_hash = '9fb044a3858f6c5ddfda1f8f119fc1b284243338afc5fc4077834761f57e2d9d',
  updated_at = NOW()
WHERE slug = 'website-launch-checklist';
