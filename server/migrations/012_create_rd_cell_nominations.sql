CREATE TABLE IF NOT EXISTS rd_cell_nominations (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  nomination_details JSONB NOT NULL,
  overview JSONB NOT NULL,
  attachments JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rd_cell_nominations_user_id
  ON rd_cell_nominations (user_id);
CREATE INDEX IF NOT EXISTS idx_rd_cell_nominations_created_at
  ON rd_cell_nominations (created_at DESC);
