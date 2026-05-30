-- Add new columns for tracking generation
ALTER TABLE public.roadmaps 
ADD COLUMN IF NOT EXISTS current_generating_chunk integer,
ADD COLUMN IF NOT EXISTS last_generation_error text,
ADD COLUMN IF NOT EXISTS generation_started_at timestamptz;

-- Update the check constraint for roadmap_tasks type to include new categories
ALTER TABLE public.roadmap_tasks DROP CONSTRAINT IF EXISTS roadmap_tasks_type_check;
ALTER TABLE public.roadmap_tasks ADD CONSTRAINT roadmap_tasks_type_check CHECK (type in ('learn', 'practice', 'build', 'apply', 'review', 'challenge', 'portfolio', 'interview'));
