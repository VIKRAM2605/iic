ALTER TABLE rd_projects_outputs
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_message TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by BIGINT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

ALTER TABLE rd_projects_outputs
  ADD CONSTRAINT rd_projects_outputs_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_rd_projects_outputs_status
  ON rd_projects_outputs (status);
CREATE INDEX IF NOT EXISTS idx_rd_projects_outputs_reviewed_by
  ON rd_projects_outputs (reviewed_by);
