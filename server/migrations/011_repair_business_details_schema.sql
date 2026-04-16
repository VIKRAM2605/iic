CREATE TABLE IF NOT EXISTS business_details (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  business_details JSONB NOT NULL,
  overview JSONB NOT NULL,
  analysis JSONB NOT NULL,
  attachments JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE business_details
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_message TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by BIGINT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'business_details_status_check'
  ) THEN
    ALTER TABLE business_details
      ADD CONSTRAINT business_details_status_check
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_business_details_user_id ON business_details (user_id);
CREATE INDEX IF NOT EXISTS idx_business_details_created_at ON business_details (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_details_status ON business_details (status);
CREATE INDEX IF NOT EXISTS idx_business_details_reviewed_by ON business_details (reviewed_by);
