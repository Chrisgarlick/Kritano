-- Add week_number and day_of_week columns to marketing_content
-- for structured filtering and chronological sorting.
BEGIN;

ALTER TABLE marketing_content ADD COLUMN week_number INTEGER;
ALTER TABLE marketing_content ADD COLUMN day_of_week INTEGER; -- 1=Mon, 2=Tue, ..., 7=Sun

CREATE INDEX idx_marketing_content_week ON marketing_content(week_number);
CREATE INDEX idx_marketing_content_day ON marketing_content(day_of_week);

-- Back-fill from existing notes field patterns:
--   "Week 3 - Monday"   → week_number=3, day_of_week=1
--   "Week 1 - Post 1"   → week_number=1, day_of_week=2 (LinkedIn Tue)
--   "Week 2 - Article 1" → week_number=2, day_of_week=3 (Blog mid-week)

UPDATE marketing_content SET
  week_number = CASE
    WHEN notes LIKE 'Week 1 -%'  THEN 1
    WHEN notes LIKE 'Week 2 -%'  THEN 2
    WHEN notes LIKE 'Week 3 -%'  THEN 3
    WHEN notes LIKE 'Week 4 -%'  THEN 4
    WHEN notes LIKE 'Week 5 -%'  THEN 5
    WHEN notes LIKE 'Week 6 -%'  THEN 6
    WHEN notes LIKE 'Week 7 -%'  THEN 7
    WHEN notes LIKE 'Week 8 -%'  THEN 8
    WHEN notes LIKE 'Week 9 -%'  THEN 9
    WHEN notes LIKE 'Week 10 -%' THEN 10
    WHEN notes LIKE 'Week 11 -%' THEN 11
    WHEN notes LIKE 'Week 12 -%' THEN 12
    ELSE NULL
  END,
  day_of_week = CASE
    WHEN notes LIKE '% - Monday'    THEN 1
    WHEN notes LIKE '% - Tuesday'   THEN 2
    WHEN notes LIKE '% - Wednesday' THEN 3
    WHEN notes LIKE '% - Thursday'  THEN 4
    WHEN notes LIKE '% - Friday'    THEN 5
    WHEN notes LIKE '% - Saturday'  THEN 6
    WHEN notes LIKE '% - Sunday'    THEN 7
    WHEN notes LIKE '% - Post 1'    THEN 2
    WHEN notes LIKE '% - Post 2'    THEN 4
    WHEN notes LIKE '% - Article 1' THEN 3
    WHEN notes LIKE '% - Article 2' THEN 5
    ELSE NULL
  END
WHERE notes IS NOT NULL;

COMMIT;
