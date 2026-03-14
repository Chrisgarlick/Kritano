-- Migration: 047_add_file_extraction_to_tiers
-- Description: Enable file-extraction check for starter, pro, agency, enterprise tiers.

UPDATE tier_limits
SET available_checks = array_append(available_checks, 'file-extraction')
WHERE tier IN ('starter', 'pro', 'agency', 'enterprise')
  AND NOT ('file-extraction' = ANY(available_checks));
