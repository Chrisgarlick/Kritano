-- Migration: 117_toc_inline.sql
-- Migration 116 added a `## Contents` H2 to four resources, but typeset
-- page-breaks before every H2 — so the Contents landed on its own page
-- after a near-empty title page. The fix is to use a bold paragraph
-- ("**Contents**") instead of an H2, so the Contents flows on the same
-- page as the title and lede.
--
-- Source MDs are updated; this migration bumps each content_hash so the
-- cached PDFs from migration 116 are invalidated and re-rendered on next
-- request.

UPDATE gated_resources SET
  content_hash = 'feccb11eba5eaf4736216f7bfe48acbc69158d63cabd5ab5eecbc199190823a7',
  updated_at = NOW()
WHERE slug = 'website-health-checklist';

UPDATE gated_resources SET
  content_hash = '36aef1bd8fbfe935c8b642ce5fa6a5d07884771ec2f4278a6b87a29d78f8779d',
  updated_at = NOW()
WHERE slug = 'eaa-compliance-guide';

UPDATE gated_resources SET
  content_hash = '11599457efa57eb724c52877388868b3d5794ed6c5cba3660a43ba8fbe916c63',
  updated_at = NOW()
WHERE slug = 'aeo-optimisation-guide';

UPDATE gated_resources SET
  content_hash = '2510d9f3d2f875c70a013619704308a58ab330aab4f0d496bbd8142de193448e',
  updated_at = NOW()
WHERE slug = 'website-launch-checklist';
