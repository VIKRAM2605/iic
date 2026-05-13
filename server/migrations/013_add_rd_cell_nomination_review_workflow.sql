ALTER TABLE rd_cell_nominations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_message TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by BIGINT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

ALTER TABLE rd_cell_nominations
  ADD CONSTRAINT rd_cell_nominations_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_rd_cell_nominations_status
  ON rd_cell_nominations (status);
CREATE INDEX IF NOT EXISTS idx_rd_cell_nominations_reviewed_by
  ON rd_cell_nominations (reviewed_by);
