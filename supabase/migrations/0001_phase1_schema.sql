-- Phase 1 schema: admin memberships, enquiries, events, notes, notification outbox
create extension if not exists "pgcrypto";

do $$ begin
  create type enquiry_status as enum ('new','reviewing','awaiting_customer','qualified','declined','converted','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type admin_role as enum ('owner','member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_status as enum ('pending','processing','sent','failed');
exception when duplicate_object then null; end $$;

create table if not exists public.admin_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role admin_role not null default 'member',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id)
);

create sequence if not exists public.enquiry_ref_seq;

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  reference_number text not null unique,
  idempotency_key uuid not null unique,
  payload_fingerprint text not null,
  service_slug text not null,
  status enquiry_status not null default 'new',
  project_title text not null check (char_length(project_title) between 3 and 120),
  project_summary text not null check (char_length(project_summary) between 30 and 5000),
  service_details jsonb not null default '{}'::jsonb check (jsonb_typeof(service_details) = 'object'),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) <= 254),
  email_normalized text not null,
  company_or_organization text null,
  phone text null,
  preferred_contact_method text not null default 'email' check (preferred_contact_method in ('email','whatsapp')),
  budget_band text null check (budget_band is null or budget_band in ('under_10000','10000_30000','30000_75000','75000_150000','over_150000','not_sure','prefer_not_to_say')),
  timeline_preference text null check (timeline_preference is null or timeline_preference in ('flexible','under_1_week','2_4_weeks','1_3_months','specific_date')),
  preferred_date date null,
  reference_urls jsonb not null default '[]'::jsonb check (jsonb_typeof(reference_urls) = 'array'),
  privacy_notice_version text not null,
  privacy_notice_acknowledged_at timestamptz not null,
  assigned_to uuid null references auth.users(id),
  decline_reason text null,
  source_path text null,
  utm_source text null,
  utm_medium text null,
  utm_campaign text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  converted_at timestamptz null,
  archived_at timestamptz null
);

create index if not exists enquiries_created_idx on public.enquiries (created_at desc);
create index if not exists enquiries_status_created_idx on public.enquiries (status, created_at desc);
create index if not exists enquiries_service_created_idx on public.enquiries (service_slug, created_at desc);
create index if not exists enquiries_assigned_idx on public.enquiries (assigned_to);
create index if not exists enquiries_email_idx on public.enquiries (email_normalized);

create table if not exists public.enquiry_events (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  actor_user_id uuid null references auth.users(id),
  event_type text not null check (event_type in ('created','status_changed','assigned','unassigned','internal_note_added','notification_failed','notification_retried','archived')),
  from_status text null,
  to_status text null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists enquiry_events_enquiry_idx on public.enquiry_events (enquiry_id, created_at desc);

create table if not exists public.enquiry_internal_notes (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  author_user_id uuid not null references auth.users(id),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists enquiry_notes_enquiry_idx on public.enquiry_internal_notes (enquiry_id, created_at desc);

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  notification_type text not null check (notification_type in ('team_new_enquiry','customer_receipt')),
  recipient text not null,
  status notification_status not null default 'pending',
  attempt_count int not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz null,
  sent_at timestamptz null,
  provider_message_id text null,
  last_error_code text null,
  created_at timestamptz not null default now(),
  unique(enquiry_id, notification_type)
);
create index if not exists outbox_status_idx on public.notification_outbox (status, created_at);
