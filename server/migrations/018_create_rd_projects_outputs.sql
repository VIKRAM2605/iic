CREATE TABLE IF NOT EXISTS rd_projects_outputs (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_details JSONB NOT NULL,
  overview JSONB NOT NULL,
  attachments JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rd_projects_outputs_user_id
  ON rd_projects_outputs (user_id);
CREATE INDEX IF NOT EXISTS idx_rd_projects_outputs_created_at
  ON rd_projects_outputs (created_at DESC);
