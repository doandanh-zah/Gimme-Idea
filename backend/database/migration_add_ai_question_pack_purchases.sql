-- Migration: AI question pack purchases ($1 => 5 questions)

CREATE TABLE IF NOT EXISTS ai_question_pack_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tx_hash TEXT NOT NULL UNIQUE,
  amount_usd NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  questions_granted INTEGER NOT NULL DEFAULT 5,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_question_pack_purchases_user ON ai_question_pack_purchases(user_id, created_at DESC);
