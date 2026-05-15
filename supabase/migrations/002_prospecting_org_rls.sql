-- Phase 2 follow-up: org-aware RLS baseline

-- Read org_id from JWT custom claim. If missing/invalid, return NULL.
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN COALESCE(auth.jwt() ->> 'org_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN (auth.jwt() ->> 'org_id')::uuid
    ELSE NULL
  END;
$$;

-- Remove temporary permissive policies from migration 001.
DROP POLICY IF EXISTS prospecting_accounts_auth_all ON prospecting_accounts;
DROP POLICY IF EXISTS prospecting_contacts_auth_all ON prospecting_contacts;
DROP POLICY IF EXISTS prospecting_opportunities_auth_all ON prospecting_opportunities;
DROP POLICY IF EXISTS prospecting_tasks_auth_all ON prospecting_tasks;

-- Accounts: direct org_id filter.
CREATE POLICY prospecting_accounts_select_org
  ON prospecting_accounts
  FOR SELECT
  TO authenticated
  USING (org_id = public.current_org_id());

CREATE POLICY prospecting_accounts_insert_org
  ON prospecting_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.current_org_id());

CREATE POLICY prospecting_accounts_update_org
  ON prospecting_accounts
  FOR UPDATE
  TO authenticated
  USING (org_id = public.current_org_id())
  WITH CHECK (org_id = public.current_org_id());

CREATE POLICY prospecting_accounts_delete_org
  ON prospecting_accounts
  FOR DELETE
  TO authenticated
  USING (org_id = public.current_org_id());

-- Contacts: derive access via parent account org.
CREATE POLICY prospecting_contacts_select_org
  ON prospecting_contacts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM prospecting_accounts a
      WHERE a.id = prospecting_contacts.account_id
        AND a.org_id = public.current_org_id()
    )
  );

CREATE POLICY prospecting_contacts_insert_org
  ON prospecting_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM prospecting_accounts a
      WHERE a.id = prospecting_contacts.account_id
        AND a.org_id = public.current_org_id()
    )
  );

CREATE POLICY prospecting_contacts_update_org
  ON prospecting_contacts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM prospecting_accounts a
      WHERE a.id = prospecting_contacts.account_id
        AND a.org_id = public.current_org_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM prospecting_accounts a
      WHERE a.id = prospecting_contacts.account_id
        AND a.org_id = public.current_org_id()
    )
  );

CREATE POLICY prospecting_contacts_delete_org
  ON prospecting_contacts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM prospecting_accounts a
      WHERE a.id = prospecting_contacts.account_id
        AND a.org_id = public.current_org_id()
    )
  );

-- Opportunities: direct org_id filter.
CREATE POLICY prospecting_opportunities_select_org
  ON prospecting_opportunities
  FOR SELECT
  TO authenticated
  USING (org_id = public.current_org_id());

CREATE POLICY prospecting_opportunities_insert_org
  ON prospecting_opportunities
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.current_org_id());

CREATE POLICY prospecting_opportunities_update_org
  ON prospecting_opportunities
  FOR UPDATE
  TO authenticated
  USING (org_id = public.current_org_id())
  WITH CHECK (org_id = public.current_org_id());

CREATE POLICY prospecting_opportunities_delete_org
  ON prospecting_opportunities
  FOR DELETE
  TO authenticated
  USING (org_id = public.current_org_id());

-- Tasks: direct org_id filter.
CREATE POLICY prospecting_tasks_select_org
  ON prospecting_tasks
  FOR SELECT
  TO authenticated
  USING (org_id = public.current_org_id());

CREATE POLICY prospecting_tasks_insert_org
  ON prospecting_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.current_org_id());

CREATE POLICY prospecting_tasks_update_org
  ON prospecting_tasks
  FOR UPDATE
  TO authenticated
  USING (org_id = public.current_org_id())
  WITH CHECK (org_id = public.current_org_id());

CREATE POLICY prospecting_tasks_delete_org
  ON prospecting_tasks
  FOR DELETE
  TO authenticated
  USING (org_id = public.current_org_id());
