-- Make organization_id nullable on subscriptions to support pure user-centric subscriptions.
-- User-level subscriptions (via Stripe checkout, admin panel, or trial) don't need an org.

ALTER TABLE subscriptions ALTER COLUMN organization_id DROP NOT NULL;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_organization_id_key;
