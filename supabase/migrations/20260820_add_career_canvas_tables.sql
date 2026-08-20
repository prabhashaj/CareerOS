-- =========================================================
-- Career Canvas (Resume Studio) Tables & Policies
-- =========================================================

-- 1. RESUMES
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled resume',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  template_id TEXT NOT NULL DEFAULT 'minimal',
  created_from_job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_updated ON public.resumes(user_id, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumes TO authenticated;
GRANT ALL ON public.resumes TO service_role;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'resumes' AND policyname = 'Users CRUD own resumes'
  ) THEN
    CREATE POLICY "Users CRUD own resumes" ON public.resumes
      FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE TRIGGER trg_resumes_updated BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. RESUME VERSIONS (Snapshots / Checkpoints)
CREATE TABLE IF NOT EXISTS public.resume_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  label TEXT NOT NULL DEFAULT 'Snapshot',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  template_id TEXT NOT NULL DEFAULT 'minimal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resume_versions_resume ON public.resume_versions(resume_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_versions_user ON public.resume_versions(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_versions TO authenticated;
GRANT ALL ON public.resume_versions TO service_role;
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'resume_versions' AND policyname = 'Users CRUD own resume versions'
  ) THEN
    CREATE POLICY "Users CRUD own resume versions" ON public.resume_versions
      FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 3. AGENT CHANGELOGS
CREATE TABLE IF NOT EXISTS public.agent_changelogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  summary_of_changes TEXT NOT NULL,
  match_score INTEGER,
  missing_keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_changelogs_resume ON public.agent_changelogs(resume_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_changelogs_user ON public.agent_changelogs(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_changelogs TO authenticated;
GRANT ALL ON public.agent_changelogs TO service_role;
ALTER TABLE public.agent_changelogs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'agent_changelogs' AND policyname = 'Users CRUD own changelogs'
  ) THEN
    CREATE POLICY "Users CRUD own changelogs" ON public.agent_changelogs
      FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
