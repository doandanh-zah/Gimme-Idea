-- Resolve /projects/:id and /idea/:id when the client only has the first
-- 8 hex chars of a UUID (legacy IdeaCard links, missing slug).
-- PostgREST cannot ILIKE filter UUID columns, so we expose an RPC.

CREATE OR REPLACE FUNCTION public.find_project_by_id_prefix(prefix TEXT)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  found_id UUID;
BEGIN
  IF prefix IS NULL OR length(trim(prefix)) < 8 THEN
    RETURN NULL;
  END IF;

  SELECT id INTO found_id
  FROM public.projects
  WHERE id::text ILIKE lower(trim(prefix)) || '%'
  LIMIT 1;

  RETURN found_id;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_projects_id_text ON public.projects ((id::text));

GRANT EXECUTE ON FUNCTION public.find_project_by_id_prefix(TEXT) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
