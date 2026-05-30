-- SkillQuest AI V2 — Supabase schema with Row Level Security
-- Includes Memory System, Roadmap Versioning, RPG Mechanics, and Coach Modes

create extension if not exists "pgcrypto";

-- ==========================================
-- 1. PROFILES & METRICS
-- ==========================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  total_xp integer not null default 0,
  global_level integer not null default 1,
  rank_title text not null default 'Novice Learner',
  current_streak integer not null default 0,
  max_streak integer not null default 0,
  tasks_completed integer not null default 0,
  learning_style text,
  readiness_score integer not null default 0,
  learning_velocity decimal not null default 0.0,
  weekly_consistency integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==========================================
-- 2. AI MEMORY (SKILLS SYSTEM)
-- ==========================================
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  skill_name text not null,
  proficiency_level text not null check (proficiency_level in ('beginner', 'intermediate', 'advanced', 'expert')),
  is_strength boolean not null default false,
  is_weakness boolean not null default false,
  last_practiced timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, skill_name)
);

-- ==========================================
-- 3. COACH CHATS
-- ==========================================
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  coach_mode text not null default 'Career Coach' check (coach_mode in ('Career Coach', 'Interview Coach', 'DSA Coach', 'AI/ML Coach', 'Productivity Coach', 'Startup Coach')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

-- ==========================================
-- 4. ROADMAPS (VERSIONED)
-- ==========================================
create table if not exists public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  version text not null default 'V1',
  title text not null,
  career_goal text not null,
  duration_days integer not null default 60,
  generated_weeks_count integer not null default 0,
  total_weeks integer not null default 8,
  current_generating_chunk integer,
  last_generation_error text,
  generation_started_at timestamptz,
  status text not null default 'active' check (status in ('generating', 'partially_ready', 'active', 'archived', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roadmap_sections (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps (id) on delete cascade,
  section_number integer not null,
  title text not null,
  description text,
  unique (roadmap_id, section_number)
);

-- ==========================================
-- 5. RPG LEVELS & TASKS
-- ==========================================
create table if not exists public.roadmap_levels (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.roadmap_sections (id) on delete cascade,
  level_number integer not null,
  title text not null,
  objective text not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced', 'boss')),
  xp_reward integer not null default 100,
  is_boss_level boolean not null default false,
  status text not null default 'locked' check (status in ('locked', 'unlocked', 'completed')),
  motivational_message text,
  practice_challenge text,
  resources jsonb default '[]',
  unique (section_id, level_number)
);

create table if not exists public.roadmap_tasks (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references public.roadmap_levels (id) on delete cascade,
  title text not null,
  type text not null check (type in ('learn', 'practice', 'build', 'apply', 'review', 'challenge', 'portfolio', 'interview')),
  resource_links jsonb default '[]', -- Intelligent resources
  requires_proof boolean not null default false,
  proof_type text not null default 'none' check (proof_type in ('url', 'text', 'github', 'linkedin', 'pdf', 'image', 'none')),
  status text not null default 'pending' check (status in ('pending', 'submitted', 'approved', 'rejected')),
  sort_order integer not null default 0
);

-- ==========================================
-- 6. PROOFS (V2) & ACHIEVEMENTS
-- ==========================================
create table if not exists public.proofs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.roadmap_tasks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text,
  file_url text,
  link_url text,
  ai_feedback text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_name text not null,
  description text not null,
  icon_url text,
  earned_at timestamptz not null default now()
);

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  quest_type text not null check (quest_type in ('daily', 'weekly')),
  title text not null,
  xp_reward integer not null,
  is_completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ==========================================
-- TRIGGERS & RLS
-- ==========================================

create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger skills_updated_at before update on public.skills for each row execute function public.set_updated_at();
create trigger chats_updated_at before update on public.chats for each row execute function public.set_updated_at();
create trigger roadmaps_updated_at before update on public.roadmaps for each row execute function public.set_updated_at();

-- New user handler
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.skills enable row level security;
alter table public.chats enable row level security;
alter table public.chat_messages enable row level security;
alter table public.roadmaps enable row level security;
alter table public.roadmap_sections enable row level security;
alter table public.roadmap_levels enable row level security;
alter table public.roadmap_tasks enable row level security;
alter table public.proofs enable row level security;
alter table public.achievements enable row level security;
alter table public.quests enable row level security;

-- Broad user policies
create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users manage own skills" on public.skills for all using (auth.uid() = user_id);
create policy "Users manage own chats" on public.chats for all using (auth.uid() = user_id);
create policy "Users read own messages" on public.chat_messages for select using (exists (select 1 from public.chats c where c.id = chat_id and c.user_id = auth.uid()));
create policy "Users insert own messages" on public.chat_messages for insert with check (exists (select 1 from public.chats c where c.id = chat_id and c.user_id = auth.uid()));
create policy "Users manage own roadmaps" on public.roadmaps for all using (auth.uid() = user_id);
create policy "Users manage own sections" on public.roadmap_sections for all using (exists (select 1 from public.roadmaps r where r.id = roadmap_id and r.user_id = auth.uid()));
create policy "Users manage own levels" on public.roadmap_levels for all using (exists (select 1 from public.roadmap_sections s join public.roadmaps r on r.id = s.roadmap_id where s.id = section_id and r.user_id = auth.uid()));
create policy "Users manage own tasks" on public.roadmap_tasks for all using (exists (select 1 from public.roadmap_levels l join public.roadmap_sections s on s.id = l.section_id join public.roadmaps r on r.id = s.roadmap_id where l.id = level_id and r.user_id = auth.uid()));
create policy "Users manage own proofs" on public.proofs for all using (auth.uid() = user_id);
create policy "Users manage own achievements" on public.achievements for all using (auth.uid() = user_id);
create policy "Users manage own quests" on public.quests for all using (auth.uid() = user_id);
