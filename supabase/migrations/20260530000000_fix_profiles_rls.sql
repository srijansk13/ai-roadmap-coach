-- Add INSERT policy for profiles so users can insert their own profile
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Ensure the UPDATE policy also explicitly checks auth.uid()
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
