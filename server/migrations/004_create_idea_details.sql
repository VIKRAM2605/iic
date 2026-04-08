CREATE TABLE IF NOT EXISTS idea_details (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  program_details JSONB NOT NULL,
  duration_details JSONB NOT NULL,
  overview JSONB NOT NULL,
  speaker_details JSONB NOT NULL,
  attachments JSONB NOT NULL,
  social_media JSONB NOT NULL,
  bip_portal JSONB NOT NULL,
  faculty JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_idea_details_user_id ON idea_details (user_id);
CREATE INDEX IF NOT EXISTS idx_idea_details_created_at ON idea_details (created_at DESC);
