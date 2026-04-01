-- Atomic job claim for multi-worker deployments.
-- Uses SELECT ... FOR UPDATE SKIP LOCKED so concurrent workers never pick
-- the same job, even when multiple replicas call this simultaneously.
--
-- p_categories: categories this worker handles, e.g. ARRAY['music'] or ARRAY['noise','wind']
-- Returns the claimed job row (already marked 'processing'), or zero rows if nothing available.

CREATE OR REPLACE FUNCTION claim_job(p_categories text[])
RETURNS SETOF public.jobs
LANGUAGE plpgsql
AS $$
DECLARE
  v_job public.jobs;
BEGIN
  SELECT *
    INTO v_job
    FROM public.jobs
   WHERE status   = 'queued'
     AND category = ANY(p_categories)
   ORDER BY created_at ASC
   LIMIT 1
     FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.jobs
     SET status     = 'processing',
         updated_at = NOW()
   WHERE id = v_job.id;

  v_job.status     := 'processing';
  v_job.updated_at := NOW();
  RETURN NEXT v_job;
END;
$$;

-- Composite index: makes the WHERE + ORDER BY in claim_job an index-only scan
CREATE INDEX IF NOT EXISTS jobs_status_category_created
    ON public.jobs (status, category, created_at ASC);

-- Index for dead-letter sweep (jobs stuck in 'processing' too long)
CREATE INDEX IF NOT EXISTS jobs_status_updated_at
    ON public.jobs (status, updated_at);

-- Auto-update updated_at on any row change (needed for dead-letter accuracy)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS jobs_set_updated_at ON public.jobs;
CREATE TRIGGER jobs_set_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
