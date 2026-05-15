-- Phase 2 starter migration: core CRM objects

CREATE TABLE IF NOT EXISTS prospecting_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  industry TEXT,
  company_size TEXT,
  segment TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  UNIQUE(org_id, name)
);

CREATE TABLE IF NOT EXISTS prospecting_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES prospecting_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  decision_level TEXT,
  interest_level TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prospecting_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES prospecting_accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES prospecting_contacts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  project_type TEXT NOT NULL,
  training_days NUMERIC(5,1) NOT NULL CHECK (training_days > 0),
  stage TEXT NOT NULL DEFAULT 'target',
  probability INT NOT NULL DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  value_pln INT,
  weighted_days NUMERIC(6,2) GENERATED ALWAYS AS ((training_days * probability::numeric) / 100) STORED,
  expected_close_date DATE,
  assigned_to UUID NOT NULL,
  problem_trigger TEXT,
  next_step TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

CREATE TABLE IF NOT EXISTS prospecting_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  opportunity_id UUID REFERENCES prospecting_opportunities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  assigned_to UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_prospecting_opportunities_org_id
  ON prospecting_opportunities(org_id);

CREATE INDEX IF NOT EXISTS idx_prospecting_opportunities_stage
  ON prospecting_opportunities(stage);

CREATE INDEX IF NOT EXISTS idx_prospecting_opportunities_assigned_to
  ON prospecting_opportunities(assigned_to);

CREATE INDEX IF NOT EXISTS idx_prospecting_tasks_org_due
  ON prospecting_tasks(org_id, due_date);

ALTER TABLE prospecting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospecting_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospecting_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospecting_tasks ENABLE ROW LEVEL SECURITY;

-- Starter RLS policy: allow all for authenticated users (replace with org-aware policy next)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'prospecting_accounts'
      AND policyname = 'prospecting_accounts_auth_all'
  ) THEN
    CREATE POLICY prospecting_accounts_auth_all
      ON prospecting_accounts
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'prospecting_contacts'
      AND policyname = 'prospecting_contacts_auth_all'
  ) THEN
    CREATE POLICY prospecting_contacts_auth_all
      ON prospecting_contacts
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'prospecting_opportunities'
      AND policyname = 'prospecting_opportunities_auth_all'
  ) THEN
    CREATE POLICY prospecting_opportunities_auth_all
      ON prospecting_opportunities
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'prospecting_tasks'
      AND policyname = 'prospecting_tasks_auth_all'
  ) THEN
    CREATE POLICY prospecting_tasks_auth_all
      ON prospecting_tasks
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
