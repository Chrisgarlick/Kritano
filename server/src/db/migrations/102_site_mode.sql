-- Add site_mode setting (replaces coming_soon_enabled as the primary control)
-- Values: 'waitlist', 'early_access', 'live'
INSERT INTO system_settings (key, value, updated_at)
VALUES ('site_mode', '"waitlist"', NOW())
ON CONFLICT (key) DO NOTHING;
