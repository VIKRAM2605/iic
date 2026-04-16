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

CREATE INDEX IF NOT EXISTS idx_business_details_user_id ON business_details (user_id);
CREATE INDEX IF NOT EXISTS idx_business_details_created_at ON business_details (created_at DESC);
