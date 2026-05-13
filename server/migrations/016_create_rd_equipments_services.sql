CREATE TABLE IF NOT EXISTS rd_equipments_services (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  equipment_details JSONB NOT NULL,
  overview JSONB NOT NULL,
  attachments JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rd_equipments_services_user_id
  ON rd_equipments_services (user_id);
CREATE INDEX IF NOT EXISTS idx_rd_equipments_services_created_at
  ON rd_equipments_services (created_at DESC);
