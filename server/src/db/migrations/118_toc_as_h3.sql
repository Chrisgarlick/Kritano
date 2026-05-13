-- Migration: 118_toc_as_h3.sql
-- Promote the inline "Contents" label from a bold paragraph to a real `### H3`
-- heading. H3 stays inline (only H2 page-breaks in typeset) and gives the
-- Contents proper semantic weight for screen readers and AI crawlers.

UPDATE gated_resources SET
  content_hash = '50eaca3a5b4a4a426ed2f4f783a1bd9b2993573119493aa065317714e15daf1e',
  updated_at = NOW()
WHERE slug = 'website-health-checklist';

UPDATE gated_resources SET
  content_hash = '57184089b7cca359c46c40cda83a93684dc4755b858a199e269927c527b1a830',
  updated_at = NOW()
WHERE slug = 'eaa-compliance-guide';

UPDATE gated_resources SET
  content_hash = '4b1bac0e6122f255620441390703025af152f639fa31ed3045020e1639120c7d',
  updated_at = NOW()
WHERE slug = 'aeo-optimisation-guide';

UPDATE gated_resources SET
  content_hash = 'f760c565fd3aefff23337b307df31a0e49916ffbcb1134933948832747503eb9',
  updated_at = NOW()
WHERE slug = 'website-launch-checklist';
