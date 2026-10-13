-- RLS: deny anonymous, scoped admin reads, writes only via RPC
alter table public.admin_memberships enable row level security;
alter table public.enquiries enable row level security;
alter table public.enquiry_events enable row level security;
alter table public.enquiry_internal_notes enable row level security;
alter table public.notification_outbox enable row level security;

revoke all on public.admin_memberships from anon, authenticated;
revoke all on public.enquiries from anon, authenticated;
revoke all on public.enquiry_events from anon, authenticated;
revoke all on public.enquiry_internal_notes from anon, authenticated;
revoke all on public.notification_outbox from anon, authenticated;

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_memberships m
    where m.user_id = auth.uid() and m.is_active = true
  );
$$;

revoke all on function public.is_active_admin() from public;
grant execute on function public.is_active_admin() to authenticated;

drop policy if exists "members read own row" on public.admin_memberships;
create policy "members read own row" on public.admin_memberships
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "admins read enquiries" on public.enquiries;
create policy "admins read enquiries" on public.enquiries
  for select to authenticated using (public.is_active_admin());

drop policy if exists "admins read events" on public.enquiry_events;
create policy "admins read events" on public.enquiry_events
  for select to authenticated using (public.is_active_admin());

drop policy if exists "admins read notes" on public.enquiry_internal_notes;
create policy "admins read notes" on public.enquiry_internal_notes
  for select to authenticated using (public.is_active_admin());

drop policy if exists "admins read outbox" on public.notification_outbox;
create policy "admins read outbox" on public.notification_outbox
  for select to authenticated using (public.is_active_admin());
