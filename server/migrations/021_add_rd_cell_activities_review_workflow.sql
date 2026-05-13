ALTER TABLE rd_cell_activities
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
    WHERE conname = 'rd_cell_activities_status_check'
  ) THEN
    ALTER TABLE rd_cell_activities
      ADD CONSTRAINT rd_cell_activities_status_check
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rd_cell_activities_status
  ON rd_cell_activities (status);
CREATE INDEX IF NOT EXISTS idx_rd_cell_activities_reviewed_by
  ON rd_cell_activities (reviewed_by);
