-- Migration to support progressive roadmap generation and gamification

-- 1. Update roadmaps table
ALTER TABLE public.roadmaps DROP CONSTRAINT IF EXISTS roadmaps_status_check;
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS generated_weeks_count integer not null default 0;
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS total_weeks integer not null default 8;
ALTER TABLE public.roadmaps ADD CONSTRAINT roadmaps_status_check CHECK (status in ('generating', 'partially_ready', 'active', 'archived', 'completed', 'failed'));

-- 2. Update roadmap_levels table
ALTER TABLE public.roadmap_levels ADD COLUMN IF NOT EXISTS motivational_message text;
ALTER TABLE public.roadmap_levels ADD COLUMN IF NOT EXISTS practice_challenge text;
ALTER TABLE public.roadmap_levels ADD COLUMN IF NOT EXISTS resources jsonb default '[]';

-- 3. Add 'completed' status to roadmap_tasks so individual tasks can be ticked off
ALTER TABLE public.roadmap_tasks DROP CONSTRAINT IF EXISTS roadmap_tasks_status_check;
ALTER TABLE public.roadmap_tasks ADD CONSTRAINT roadmap_tasks_status_check
  CHECK (status in ('pending', 'completed', 'submitted', 'approved', 'rejected'));
