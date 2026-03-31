-- Add trim_start and trim_end columns to jobs table.
-- Run this in Supabase SQL Editor after 001_init.sql.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS trim_start FLOAT,
  ADD COLUMN IF NOT EXISTS trim_end   FLOAT;
