-- ============ 1. PROFILES: no public exposure of names/phones ============
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
revoke all on public.profiles from anon;

create policy "Users read own profile" on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "Chat counterparts read each other" on public.profiles for select to authenticated
  using (exists (
    select 1
    from public.conversation_members me
    join public.conversation_members other on other.conversation_id = me.conversation_id
    where me.user_id = auth.uid() and other.user_id = public.profiles.id
  ));

-- ============ 2. Private note must never sit on the public properties row ============
update public.property_private_details d
set internal_note = case when d.internal_note = '' then coalesce(p.note, '') else d.internal_note end
from public.properties p
where p.id = d.property_id;

insert into public.property_private_details (property_id, agency_id, internal_note)
select p.id, p.agency_id, coalesce(p.note, '')
from public.properties p
where p.agency_id is not null
  and not exists (select 1 from public.property_private_details d where d.property_id = p.id);

alter table public.properties drop column note;

-- ============ 3. Helper functions: no PUBLIC / anon execute ============
revoke all on function public.has_role(uuid, public.app_role) from public;
revoke all on function public.is_agency_owner(uuid) from public;
revoke all on function public.current_agency_id() from public;
revoke all on function public.is_conversation_member(uuid) from public;
revoke all on function public.set_updated_at() from public;

grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function public.is_agency_owner(uuid) to authenticated, service_role;
grant execute on function public.current_agency_id() to authenticated, service_role;
grant execute on function public.is_conversation_member(uuid) to authenticated, service_role;
grant execute on function public.set_updated_at() to service_role;

-- ============ 4. OTP: server-only, forced RLS, zero client reach ============
revoke all on public.otp_requests from anon, authenticated;
alter table public.otp_requests force row level security;
create index if not exists otp_requests_expires_idx on public.otp_requests(expires_at);

-- ============ 5. Roles are server-controlled and immutable to clients ============
revoke insert, update, delete, truncate, references, trigger on public.user_roles from anon, authenticated;
revoke all on public.user_roles from anon;
alter table public.user_roles force row level security;

-- ============ 6. Strip every anon privilege from private/CRM/chat tables ============
revoke all on public.clients from anon;
revoke all on public.follow_ups from anon;
revoke all on public.custom_amenities from anon;
revoke all on public.property_private_details from anon;
revoke all on public.favorites from anon;
revoke all on public.conversations from anon;
revoke all on public.conversation_members from anon;
revoke all on public.messages from anon;
revoke all on public.notifications from anon;

-- anon may only read published listings and their images
revoke all on public.properties from anon;
grant select on public.properties to anon;
revoke all on public.property_images from anon;
grant select on public.property_images to anon;
revoke all on public.agency_profiles from anon;
grant select on public.agency_profiles to anon;

-- ============ 7. Chat membership: cannot enroll arbitrary users ============
drop policy if exists "Users add themselves or agency owner adds" on public.conversation_members;
create policy "Self or agency owner joins conversation" on public.conversation_members for insert to authenticated
  with check (
    (
      user_id = auth.uid()
      and exists (
        select 1 from public.conversations c
        where c.id = conversation_id
          and (c.created_by = auth.uid() or public.is_agency_owner(c.agency_id))
      )
    )
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_id and public.is_agency_owner(c.agency_id)
    )
  );

-- ============ 8. Supporting indexes for RLS predicates and listings ============
create index if not exists favorites_property_idx on public.favorites(property_id);
create index if not exists property_private_details_agency_idx on public.property_private_details(agency_id);
create index if not exists property_images_agency_idx on public.property_images(agency_id);
create index if not exists custom_amenities_agency_idx on public.custom_amenities(agency_id);
create index if not exists conversations_agency_idx on public.conversations(agency_id, last_message_at desc);
create index if not exists conversation_members_conversation_idx on public.conversation_members(conversation_id, user_id);
create index if not exists clients_user_idx on public.clients(user_id);
create index if not exists follow_ups_user_idx on public.follow_ups(user_id);