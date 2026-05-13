ALTER TABLE rd_facilities_services
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_message TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by BIGINT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

ALTER TABLE rd_facilities_services
  ADD CONSTRAINT rd_facilities_services_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_rd_facilities_services_status
  ON rd_facilities_services (status);
CREATE INDEX IF NOT EXISTS idx_rd_facilities_services_reviewed_by
  ON rd_facilities_services (reviewed_by);
