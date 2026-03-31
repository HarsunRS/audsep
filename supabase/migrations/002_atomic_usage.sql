-- Atomic usage check-and-increment to prevent race conditions.
-- Run this in Supabase SQL Editor after 001_init.sql.

DROP FUNCTION IF EXISTS check_and_increment_usage(TEXT);

CREATE OR REPLACE FUNCTION check_and_increment_usage(p_clerk_id TEXT)
RETURNS TABLE(allowed BOOLEAN, used INT, lim INT, user_plan TEXT, user_id UUID)
LANGUAGE plpgsql
AS $$
DECLARE
  v_user   RECORD;
  v_limit  INT;
  v_new_cycle BOOLEAN;
  v_now    TIMESTAMPTZ := NOW();
BEGIN
  -- Lock the row so concurrent calls queue up here instead of racing
  SELECT id, plan, credits_used_today, credits_reset_at
    INTO v_user
    FROM public.users
   WHERE clerk_id = p_clerk_id
     FOR UPDATE;

  IF NOT FOUND THEN
    -- Auto-create user on first use
    INSERT INTO public.users (clerk_id, plan, credits_used_today, credits_reset_at)
         VALUES (p_clerk_id, 'free', 1, v_now)
      RETURNING id, plan, credits_used_today, credits_reset_at INTO v_user;

    RETURN QUERY SELECT true, 1, 3, 'free'::TEXT, v_user.id::UUID;
    RETURN;
  END IF;

  -- Resolve limit for plan
  v_limit := CASE v_user.plan
    WHEN 'free'            THEN 3
    WHEN 'basic-monthly'   THEN 30
    WHEN 'pro-monthly'     THEN 100
    WHEN 'studio-monthly'  THEN 300
    WHEN 'basic-yearly'    THEN 30
    WHEN 'pro-yearly'      THEN 100
    WHEN 'studio-yearly'   THEN 300
    WHEN 'basic'           THEN 30
    WHEN 'pro'             THEN 100
    WHEN 'team'            THEN 300
    ELSE 3
  END;

  -- Check if a new billing cycle has started
  v_new_cycle := CASE v_user.plan
    WHEN 'free'
      THEN DATE_TRUNC('day',   v_now             AT TIME ZONE 'UTC')
         > DATE_TRUNC('day',   v_user.credits_reset_at AT TIME ZONE 'UTC')
    ELSE
           DATE_TRUNC('month', v_now             AT TIME ZONE 'UTC')
         > DATE_TRUNC('month', v_user.credits_reset_at AT TIME ZONE 'UTC')
  END;

  IF v_new_cycle THEN
    -- Reset counter and count this call as 1
    UPDATE public.users
       SET credits_used_today = 1,
           credits_reset_at   = v_now
     WHERE id = v_user.id;

    RETURN QUERY SELECT true, 1, v_limit, v_user.plan::TEXT, v_user.id::UUID;

  ELSIF v_user.credits_used_today >= v_limit THEN
    -- Limit already reached — do not increment
    RETURN QUERY SELECT false, v_user.credits_used_today, v_limit, v_user.plan::TEXT, v_user.id::UUID;

  ELSE
    -- Normal increment
    UPDATE public.users
       SET credits_used_today = credits_used_today + 1
     WHERE id = v_user.id;

    RETURN QUERY SELECT true, v_user.credits_used_today + 1, v_limit, v_user.plan::TEXT, v_user.id::UUID;
  END IF;
END;
$$;