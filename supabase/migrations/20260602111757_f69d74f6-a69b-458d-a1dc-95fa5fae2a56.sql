
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.doc_kind AS ENUM ('resume', 'knowledge_base', 'cover_letter', 'other');
CREATE TYPE public.job_source AS ENUM ('manual', 'url_paste', 'api', 'scraper');
CREATE TYPE public.employment_type AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'temporary');
CREATE TYPE public.application_status AS ENUM ('saved', 'drafting', 'ready_to_apply', 'submitted', 'interview', 'offer', 'rejected', 'withdrawn');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
CREATE TYPE public.review_action_type AS ENUM ('submit_application', 'send_message', 'auto_fill_form', 'send_email');

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  headline TEXT,
  location TEXT,
  timezone TEXT,
  phone TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  target_roles TEXT[] DEFAULT '{}',
  target_locations TEXT[] DEFAULT '{}',
  preferred_employment_types public.employment_type[] DEFAULT '{}',
  work_authorization TEXT,
  requires_sponsorship BOOLEAN DEFAULT false,
  min_salary INTEGER,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- =========================================================
-- USER ROLES
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- =========================================================
-- DOCUMENTS (resumes, KB docs)
-- =========================================================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.doc_kind NOT NULL DEFAULT 'resume',
  title TEXT NOT NULL,
  storage_path TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  extracted_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_user ON public.documents(user_id);
CREATE INDEX idx_documents_user_kind ON public.documents(user_id, kind);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own documents" ON public.documents
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- JOBS
-- =========================================================
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  remote BOOLEAN DEFAULT false,
  employment_type public.employment_type,
  source public.job_source NOT NULL DEFAULT 'manual',
  source_url TEXT,
  description TEXT,
  requirements TEXT[],
  skills TEXT[],
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  posted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  raw JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_user ON public.jobs(user_id);
CREATE INDEX idx_jobs_user_created ON public.jobs(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own jobs" ON public.jobs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- JOB APPLICATIONS
-- =========================================================
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status public.application_status NOT NULL DEFAULT 'saved',
  match_score NUMERIC(5,2),
  match_breakdown JSONB DEFAULT '{}'::jsonb,
  tailored_resume TEXT,
  tailored_resume_doc_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  cover_letter TEXT,
  answers JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);

CREATE INDEX idx_apps_user ON public.job_applications(user_id);
CREATE INDEX idx_apps_user_status ON public.job_applications(user_id, status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own applications" ON public.job_applications
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- APPLICATION EVENTS (analytics)
-- =========================================================
CREATE TABLE public.application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.job_applications(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_user_created ON public.application_events(user_id, created_at DESC);

GRANT SELECT, INSERT ON public.application_events TO authenticated;
GRANT ALL ON public.application_events TO service_role;
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own events" ON public.application_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own events" ON public.application_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- REVIEW QUEUE (human-in-the-loop)
-- =========================================================
CREATE TABLE public.review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.job_applications(id) ON DELETE CASCADE,
  action_type public.review_action_type NOT NULL,
  status public.review_status NOT NULL DEFAULT 'pending',
  title TEXT NOT NULL,
  summary TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  decided_at TIMESTAMPTZ,
  decided_by UUID REFERENCES auth.users(id),
  decision_notes TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_user_status ON public.review_queue(user_id, status, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_queue TO authenticated;
GRANT ALL ON public.review_queue TO service_role;
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own review items" ON public.review_queue
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- TRIGGERS
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_jobs_updated BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_apps_updated BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_review_updated BEFORE UPDATE ON public.review_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
