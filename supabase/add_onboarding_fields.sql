-- Adds onboarding fields to the profiles table
alter table public.profiles add column if not exists primary_goal text;
alter table public.profiles add column if not exists target_role text;
alter table public.profiles add column if not exists current_level text;
alter table public.profiles add column if not exists target_timeline text;
alter table public.profiles add column if not exists available_hours integer;
alter table public.profiles add column if not exists roadmap_intensity text;
alter table public.profiles add column if not exists is_onboarded boolean not null default false;
