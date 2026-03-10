-- Billing records (Stripe/card + plan purchases)
CREATE TABLE IF NOT EXISTS billing_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL DEFAULT 'stripe',
  provider_session_id TEXT NOT NULL UNIQUE,
  plan VARCHAR(20) NOT NULL CHECK (plan IN ('pack', 'pro5', 'pro10')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  payer_name TEXT,
  payer_email TEXT,
  payer_country TEXT,
  amount_usd NUMERIC(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_payments_user ON billing_payments(user_id, created_at DESC);
