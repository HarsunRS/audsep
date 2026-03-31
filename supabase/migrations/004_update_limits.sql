-- Update plan limits:
--   free:  3/day
--   basic: 30/month
--   pro:   unlimited (9999)
-- Run in Supabase SQL Editor after 002_atomic_usage.sql.

DROP FUNCTION IF EXISTS check_and_increment_usage(TEXT);

CREATE OR REPLACE FUNCTION check_and_increment_usage(p_clerk_id TEXT)
RETURNS TABLE(allowed BOOLEAN, used INT, lim INT, user_plan TEXT, user_id UUID)
LANGUAGE plpgsql
AS $$
DECLARE
  v_user      RECORD;
  v_limit     INT;
  v_new_cycle BOOLEAN;
  v_now       TIMESTAMPTZ := NOW();
BEGIN
  SELECT id, plan, credits_used_today, credits_reset_at
    INTO v_user
    FROM public.users
   WHERE clerk_id = p_clerk_id
     FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.users (clerk_id, plan, credits_used_today, credits_reset_at)
         VALUES (p_clerk_id, 'free', 1, v_now)
      RETURNING id, plan, credits_used_today, credits_reset_at INTO v_user;
    RETURN QUERY SELECT true, 1, 3, 'free'::TEXT, v_user.id::UUID;
    RETURN;
  END IF;

  v_limit := CASE v_user.plan
    WHEN 'free'            THEN 3
    -- Basic: 30/month
    WHEN 'basic'           THEN 30
    WHEN 'basic-monthly'   THEN 30
    WHEN 'basic-yearly'    THEN 30
    -- Pro: 100/month
    WHEN 'pro'             THEN 100
    WHEN 'pro-monthly'     THEN 100
    WHEN 'pro-yearly'      THEN 100
    -- Team: unlimited (9999)
    WHEN 'team'            THEN 9999
    ELSE 3
  END;

  v_new_cycle := CASE v_user.plan
    WHEN 'free'
      THEN DATE_TRUNC('day',   v_now                    AT TIME ZONE 'UTC')
         > DATE_TRUNC('day',   v_user.credits_reset_at  AT TIME ZONE 'UTC')
    ELSE
           DATE_TRUNC('month', v_now                    AT TIME ZONE 'UTC')
         > DATE_TRUNC('month', v_user.credits_reset_at  AT TIME ZONE 'UTC')
  END;

  IF v_new_cycle THEN
    UPDATE public.users
       SET credits_used_today = 1, credits_reset_at = v_now
     WHERE id = v_user.id;
    RETURN QUERY SELECT true, 1, v_limit, v_user.plan::TEXT, v_user.id::UUID;

  ELSIF v_user.credits_used_today >= v_limit THEN
    RETURN QUERY SELECT false, v_user.credits_used_today, v_limit, v_user.plan::TEXT, v_user.id::UUID;

  ELSE
    UPDATE public.users
       SET credits_used_today = credits_used_today + 1
     WHERE id = v_user.id;
    RETURN QUERY SELECT true, v_user.credits_used_today + 1, v_limit, v_user.plan::TEXT, v_user.id::UUID;
  END IF;
END;
$$;
