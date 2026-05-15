-- Phase 2 fix: fallback org resolution by user-to-org mapping

CREATE TABLE IF NOT EXISTS public.prospecting_user_orgs (
  user_id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.prospecting_user_orgs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'prospecting_user_orgs'
      AND policyname = 'prospecting_user_orgs_select_own'
  ) THEN
    CREATE POLICY prospecting_user_orgs_select_own
      ON public.prospecting_user_orgs
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Rebuild org resolver with fallback to mapping table.
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH candidate AS (
    SELECT COALESCE(
      auth.jwt() ->> 'org_id',
      auth.jwt() -> 'app_metadata' ->> 'org_id',
      auth.jwt() -> 'user_metadata' ->> 'org_id',
      (
        SELECT uo.org_id::text
        FROM public.prospecting_user_orgs uo
        WHERE uo.user_id = auth.uid()
        LIMIT 1
      )
    ) AS raw_org_id
  )
  SELECT CASE
    WHEN COALESCE(raw_org_id, '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN raw_org_id::uuid
    ELSE NULL
  END
  FROM candidate;
$$;
