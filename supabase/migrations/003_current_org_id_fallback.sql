-- Phase 2 fix: resolve org_id from common Supabase JWT claim locations

CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  WITH candidate AS (
    SELECT COALESCE(
      auth.jwt() ->> 'org_id',
      auth.jwt() -> 'app_metadata' ->> 'org_id',
      auth.jwt() -> 'user_metadata' ->> 'org_id'
    ) AS raw_org_id
  )
  SELECT CASE
    WHEN COALESCE(raw_org_id, '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      THEN raw_org_id::uuid
    ELSE NULL
  END
  FROM candidate;
$$;
