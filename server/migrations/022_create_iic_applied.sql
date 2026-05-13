CREATE TABLE IF NOT EXISTS iic_applied (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  applied_details JSONB NOT NULL,
  overview JSONB NOT NULL,
  attachments JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_iic_applied_user_id
  ON iic_applied (user_id);
CREATE INDEX IF NOT EXISTS idx_iic_applied_created_at
  ON iic_applied (created_at DESC);
