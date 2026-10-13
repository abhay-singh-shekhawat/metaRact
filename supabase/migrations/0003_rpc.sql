-- RPC contracts A–E per architecture section 9.8
-- A: privileged public creation (server role only)
create or replace function public.create_public_enquiry(payload jsonb, fingerprint text, team_recipient text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_ref text;
  v_dup boolean := false;
  v_now timestamptz := now();
  v_year text := to_char(v_now, 'YYYY');
begin
  if payload->>'idempotency_key' is null then
    raise exception 'missing idempotency key' using errcode = 'P0001';
  end if;

  select id, reference_number into v_id, v_ref from public.enquiries
    where idempotency_key = (payload->>'idempotency_key')::uuid;
  if found then
    if (select payload_fingerprint from public.enquiries where id = v_id) = fingerprint then
      return jsonb_build_object('id', v_id, 'reference_number', v_ref, 'is_duplicate', true);
    else
      raise exception 'idempotency key reused' using errcode = 'P0002';
    end if;
  end if;

  v_ref := 'REQ-' || v_year || '-' || lpad(nextval('public.enquiry_ref_seq')::text, 6, '0');

  insert into public.enquiries (
    reference_number, idempotency_key, payload_fingerprint, service_slug,
    project_title, project_summary, service_details, name, email, email_normalized,
    company_or_organization, phone, preferred_contact_method, budget_band,
    timeline_preference, preferred_date, reference_urls, privacy_notice_version,
    privacy_notice_acknowledged_at, source_path, utm_source, utm_medium, utm_campaign,
    status, created_at, updated_at
  ) values (
    v_ref, (payload->>'idempotency_key')::uuid, fingerprint, payload->>'service_slug',
    payload->>'project_title', payload->>'project_summary', coalesce((payload->'service_details')::jsonb, '{}'::jsonb),
    payload->>'name', payload->>'email', lower(payload->>'email'),
    nullif(payload->>'company_or_organization',''), nullif(payload->>'phone',''),
    coalesce(payload->>'preferred_contact_method','email'),
    nullif(payload->>'budget_band',''), nullif(payload->>'timeline_preference',''),
    nullif(payload->>'preferred_date','')::date,
    coalesce((payload->'reference_urls')::jsonb, '[]'::jsonb),
    payload->>'privacy_notice_version', v_now,
    nullif(payload->>'source_path',''), nullif(payload->>'utm_source',''),
    nullif(payload->>'utm_medium',''), nullif(payload->>'utm_campaign',''),
    'new', v_now, v_now
  ) returning id into v_id;

  insert into public.enquiry_events (enquiry_id, event_type, to_status, summary, metadata)
    values (v_id, 'created', 'new', 'Enquiry ' || v_ref || ' created', jsonb_build_object('service', payload->>'service_slug'));

  insert into public.notification_outbox (enquiry_id, notification_type, recipient)
    values (v_id, 'team_new_enquiry', team_recipient), (v_id, 'customer_receipt', lower(payload->>'email'));

  return jsonb_build_object('id', v_id, 'reference_number', v_ref, 'is_duplicate', false);
end;
$$;

revoke all on function public.create_public_enquiry(jsonb, text, text) from public, anon, authenticated;

-- B: admin status change
create or replace function public.admin_change_enquiry_status(p_enquiry_id uuid, p_new_status enquiry_status, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old enquiry_status;
  v_ok boolean := false;
begin
  if not public.is_active_admin() then
    raise exception 'not authorized' using errcode = 'P0003';
  end if;
  select status into v_old from public.enquiries where id = p_enquiry_id;
  if not found then
    raise exception 'not found' using errcode = 'P0004';
  end if;
  if v_old = p_new_status then
    raise exception 'invalid transition' using errcode = 'P0005';
  end if;
  v_ok := case
    when v_old = 'new' and p_new_status in ('reviewing','awaiting_customer','declined','archived') then true
    when v_old = 'reviewing' and p_new_status in ('awaiting_customer','qualified','declined','archived') then true
    when v_old = 'awaiting_customer' and p_new_status in ('reviewing','qualified','declined','archived') then true
    when v_old = 'qualified' and p_new_status in ('converted','reviewing','declined','archived') then true
    when v_old = 'converted' and p_new_status in ('archived') then true
    when v_old = 'declined' and p_new_status in ('archived') then true
    else false end;
  if not v_ok then
    raise exception 'invalid transition' using errcode = 'P0005';
  end if;
  if p_new_status = 'declined' and (p_reason is null or char_length(trim(p_reason)) = 0) then
    raise exception 'decline reason required' using errcode = 'P0006';
  end if;

  update public.enquiries set
    status = p_new_status,
    updated_at = now(),
    decline_reason = case when p_new_status = 'declined' then left(trim(p_reason), 500) else decline_reason end,
    converted_at = case when p_new_status = 'converted' then now() else converted_at end,
    archived_at = case when p_new_status = 'archived' then now() else archived_at end
  where id = p_enquiry_id;

  insert into public.enquiry_events (enquiry_id, actor_user_id, event_type, from_status, to_status, summary, metadata)
    values (p_enquiry_id, auth.uid(), 'status_changed', v_old::text, p_new_status::text,
      'Status ' || v_old::text || ' → ' || p_new_status::text,
      jsonb_build_object('reason', left(coalesce(p_reason,''), 500)));

  return jsonb_build_object('id', p_enquiry_id, 'from', v_old, 'to', p_new_status);
end;
$$;

revoke all on function public.admin_change_enquiry_status(uuid, enquiry_status, text) from public, anon;
grant execute on function public.admin_change_enquiry_status(uuid, enquiry_status, text) to authenticated;

-- C: assignment
create or replace function public.admin_assign_enquiry(p_enquiry_id uuid, p_assignee uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_exists boolean;
begin
  if not public.is_active_admin() then
    raise exception 'not authorized' using errcode = 'P0003';
  end if;
  select exists(select 1 from public.enquiries where id = p_enquiry_id) into v_exists;
  if not v_exists then raise exception 'not found' using errcode = 'P0004'; end if;
  if p_assignee is not null then
    select exists(select 1 from public.admin_memberships where user_id = p_assignee and is_active) into v_exists;
    if not v_exists then raise exception 'assignee not an active admin' using errcode = 'P0007'; end if;
  end if;
  update public.enquiries set assigned_to = p_assignee, updated_at = now() where id = p_enquiry_id;
  insert into public.enquiry_events (enquiry_id, actor_user_id, event_type, summary, metadata)
    values (p_enquiry_id, auth.uid(), case when p_assignee is null then 'unassigned' else 'assigned' end,
      case when p_assignee is null then 'Enquiry unassigned' else 'Enquiry assigned' end,
      jsonb_build_object('assignee', p_assignee));
  return jsonb_build_object('id', p_enquiry_id, 'assigned_to', p_assignee);
end;
$$;
revoke all on function public.admin_assign_enquiry(uuid, uuid) from public, anon;
grant execute on function public.admin_assign_enquiry(uuid, uuid) to authenticated;

-- D: internal note
create or replace function public.admin_add_enquiry_note(p_enquiry_id uuid, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if not public.is_active_admin() then
    raise exception 'not authorized' using errcode = 'P0003';
  end if;
  if p_body is null or char_length(trim(p_body)) < 1 or char_length(trim(p_body)) > 5000 then
    raise exception 'invalid note length' using errcode = 'P0008';
  end if;
  if not exists(select 1 from public.enquiries where id = p_enquiry_id) then
    raise exception 'not found' using errcode = 'P0004';
  end if;
  insert into public.enquiry_internal_notes (enquiry_id, author_user_id, body)
    values (p_enquiry_id, auth.uid(), trim(p_body)) returning id into v_id;
  insert into public.enquiry_events (enquiry_id, actor_user_id, event_type, summary)
    values (p_enquiry_id, auth.uid(), 'internal_note_added', 'Internal note added');
  update public.enquiries set updated_at = now() where id = p_enquiry_id;
  return jsonb_build_object('id', v_id, 'enquiry_id', p_enquiry_id);
end;
$$;
revoke all on function public.admin_add_enquiry_note(uuid, text) from public, anon;
grant execute on function public.admin_add_enquiry_note(uuid, text) to authenticated;

-- E: notification claim/complete + admin retry claim
create or replace function public.begin_notification_attempt(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare r record;
begin
  update public.notification_outbox set status = 'processing', attempt_count = attempt_count + 1, last_attempt_at = now()
    where id = p_id and status = 'pending' and attempt_count < 5
    returning * into r;
  if not found then raise exception 'notification not claimable' using errcode = 'P0009'; end if;
  return jsonb_build_object('id', r.id, 'enquiry_id', r.enquiry_id, 'notification_type', r.notification_type, 'recipient', r.recipient, 'attempt', r.attempt_count);
end;
$$;
revoke all on function public.begin_notification_attempt(uuid) from public, anon, authenticated;

create or replace function public.complete_notification_attempt(p_id uuid, p_sent boolean, p_message_id text, p_error text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare r record;
begin
  select * into r from public.notification_outbox where id = p_id;
  if not found then raise exception 'not found' using errcode = 'P0004'; end if;
  if r.status <> 'processing' then raise exception 'unexpected state' using errcode = 'P0010'; end if;
  update public.notification_outbox set
    status = case when p_sent then 'sent'::notification_status else 'failed'::notification_status end,
    provider_message_id = p_message_id, last_error_code = left(coalesce(p_error,''), 120),
    sent_at = case when p_sent then now() else sent_at end
  where id = p_id;
  if not p_sent then
    insert into public.enquiry_events (enquiry_id, event_type, summary, metadata)
      values (r.enquiry_id, 'notification_failed', 'Notification delivery failed', jsonb_build_object('type', r.notification_type, 'code', left(coalesce(p_error,''),120)));
  end if;
  return jsonb_build_object('id', p_id, 'sent', p_sent);
end;
$$;
revoke all on function public.complete_notification_attempt(uuid, boolean, text, text) from public, anon, authenticated;

create or replace function public.admin_claim_notification_retry(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare r record;
begin
  if not public.is_active_admin() then
    raise exception 'not authorized' using errcode = 'P0003';
  end if;
  update public.notification_outbox set status = 'processing', attempt_count = attempt_count + 1, last_attempt_at = now()
    where id = p_id and attempt_count < 5
      and (status = 'failed' or (status in ('pending','processing') and (last_attempt_at is null or last_attempt_at < now() - interval '10 minutes')))
    returning * into r;
  if not found then raise exception 'notification not retryable' using errcode = 'P0009'; end if;
  insert into public.enquiry_events (enquiry_id, actor_user_id, event_type, summary, metadata)
    values (r.enquiry_id, auth.uid(), 'notification_retried', 'Notification retry claimed', jsonb_build_object('type', r.notification_type));
  return jsonb_build_object('id', r.id, 'enquiry_id', r.enquiry_id, 'notification_type', r.notification_type, 'recipient', r.recipient, 'attempt', r.attempt_count);
end;
$$;
revoke all on function public.admin_claim_notification_retry(uuid) from public, anon;
grant execute on function public.admin_claim_notification_retry(uuid) to authenticated;
