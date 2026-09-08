-- ============ ROLES ============
create type public.app_role as enum ('user', 'agency');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_phone_key on public.profiles(phone) where phone is not null;
grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- ============ AGENCIES ============
create table public.agency_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  city text not null default 'تهران',
  district text not null default '',
  address text not null default '',
  phone text not null default '',
  logo_url text,
  bio text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.agency_profiles to authenticated;
grant select on public.agency_profiles to anon;
grant all on public.agency_profiles to service_role;
alter table public.agency_profiles enable row level security;
create policy "Agencies are viewable by everyone" on public.agency_profiles for select using (true);
create policy "Owner inserts own agency" on public.agency_profiles for insert to authenticated with check (auth.uid() = owner_id and public.has_role(auth.uid(), 'agency'));
create policy "Owner updates own agency" on public.agency_profiles for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create trigger agency_profiles_updated_at before update on public.agency_profiles for each row execute function public.set_updated_at();

create or replace function public.is_agency_owner(_agency_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.agency_profiles a where a.id = _agency_id and a.owner_id = auth.uid())
$$;

create or replace function public.current_agency_id()
returns uuid language sql stable security definer set search_path = public as $$
  select a.id from public.agency_profiles a where a.owner_id = auth.uid() limit 1
$$;

-- ============ PROPERTIES ============
alter table public.properties
  add column agency_id uuid references public.agency_profiles(id) on delete cascade,
  add column status text not null default 'available',
  add column is_public boolean not null default false,
  add column published_at timestamptz,
  add column archived boolean not null default false;

alter table public.properties add constraint properties_status_check
  check (status in ('available','reserved','sold','rented'));

create table public.property_private_details (
  property_id uuid primary key references public.properties(id) on delete cascade,
  agency_id uuid not null references public.agency_profiles(id) on delete cascade,
  owner_name text not null default '',
  owner_phone text not null default '',
  internal_note text not null default '',
  commission text not null default '',
  access_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.property_private_details (property_id, agency_id, owner_name, owner_phone, internal_note)
select p.id, p.agency_id, p.owner_name, p.owner_phone, p.note from public.properties p where p.agency_id is not null;
alter table public.properties drop column owner_name, drop column owner_phone;

grant select, insert, update, delete on public.property_private_details to authenticated;
grant all on public.property_private_details to service_role;
alter table public.property_private_details enable row level security;
create policy "Agency manages own private details" on public.property_private_details for all to authenticated
  using (public.is_agency_owner(agency_id)) with check (public.is_agency_owner(agency_id));
create trigger property_private_details_updated_at before update on public.property_private_details for each row execute function public.set_updated_at();

drop policy if exists "Users manage own properties" on public.properties;
grant select on public.properties to anon;
create policy "Public listings are viewable by everyone" on public.properties for select
  using (is_public = true and archived = false);
create policy "Agency reads own properties" on public.properties for select to authenticated
  using (public.is_agency_owner(agency_id));
create policy "Agency inserts own properties" on public.properties for insert to authenticated
  with check (public.is_agency_owner(agency_id) and user_id = auth.uid());
create policy "Agency updates own properties" on public.properties for update to authenticated
  using (public.is_agency_owner(agency_id)) with check (public.is_agency_owner(agency_id));
create policy "Agency deletes own properties" on public.properties for delete to authenticated
  using (public.is_agency_owner(agency_id));

create index properties_agency_idx on public.properties(agency_id);
create index properties_public_idx on public.properties(is_public, archived, created_at desc);
create index properties_deal_type_idx on public.properties(deal, type);
create index properties_city_district_idx on public.properties(city, district);
create index properties_price_idx on public.properties(price);

create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  agency_id uuid not null references public.agency_profiles(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);
create index property_images_property_idx on public.property_images(property_id, sort_order);
grant select, insert, update, delete on public.property_images to authenticated;
grant select on public.property_images to anon;
grant all on public.property_images to service_role;
alter table public.property_images enable row level security;
create policy "Images of public listings are viewable" on public.property_images for select
  using (exists (select 1 from public.properties p where p.id = property_id and p.is_public = true and p.archived = false));
create policy "Agency reads own images" on public.property_images for select to authenticated
  using (public.is_agency_owner(agency_id));
create policy "Agency manages own images" on public.property_images for all to authenticated
  using (public.is_agency_owner(agency_id)) with check (public.is_agency_owner(agency_id));

-- ============ CLIENTS / FOLLOW-UPS / AMENITIES ============
alter table public.clients add column agency_id uuid references public.agency_profiles(id) on delete cascade;
drop policy if exists "Users manage own clients" on public.clients;
create policy "Agency manages own clients" on public.clients for all to authenticated
  using (public.is_agency_owner(agency_id)) with check (public.is_agency_owner(agency_id) and user_id = auth.uid());
create index clients_agency_idx on public.clients(agency_id);

alter table public.follow_ups
  add column agency_id uuid references public.agency_profiles(id) on delete cascade,
  add column property_id uuid references public.properties(id) on delete set null,
  add column note text not null default '';
drop policy if exists "Users manage own follow ups" on public.follow_ups;
create policy "Agency manages own follow ups" on public.follow_ups for all to authenticated
  using (public.is_agency_owner(agency_id)) with check (public.is_agency_owner(agency_id) and user_id = auth.uid());
create index follow_ups_agency_due_idx on public.follow_ups(agency_id, due_date);

create table public.custom_amenities (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agency_profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (agency_id, name)
);
grant select, insert, update, delete on public.custom_amenities to authenticated;
grant all on public.custom_amenities to service_role;
alter table public.custom_amenities enable row level security;
create policy "Agency manages own amenities" on public.custom_amenities for all to authenticated
  using (public.is_agency_owner(agency_id)) with check (public.is_agency_owner(agency_id));

-- ============ FAVORITES ============
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);
create index favorites_user_idx on public.favorites(user_id, created_at desc);
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "Users manage own favorites" on public.favorites for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ CHAT ============
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete set null,
  agency_id uuid not null references public.agency_profiles(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  unique (conversation_id, user_id)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index conversation_members_user_idx on public.conversation_members(user_id);
create index messages_conversation_idx on public.messages(conversation_id, created_at);

create or replace function public.is_conversation_member(_conversation_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_members m
    where m.conversation_id = _conversation_id and m.user_id = auth.uid()
  )
$$;

grant select, insert, update on public.conversations to authenticated;
grant all on public.conversations to service_role;
alter table public.conversations enable row level security;
create policy "Members read conversations" on public.conversations for select to authenticated
  using (public.is_conversation_member(id) or public.is_agency_owner(agency_id));
create policy "Users create conversations" on public.conversations for insert to authenticated
  with check (auth.uid() = created_by);
create policy "Members update conversations" on public.conversations for update to authenticated
  using (public.is_conversation_member(id) or public.is_agency_owner(agency_id))
  with check (public.is_conversation_member(id) or public.is_agency_owner(agency_id));

grant select, insert, update, delete on public.conversation_members to authenticated;
grant all on public.conversation_members to service_role;
alter table public.conversation_members enable row level security;
create policy "Members read membership" on public.conversation_members for select to authenticated
  using (user_id = auth.uid() or public.is_conversation_member(conversation_id));
create policy "Users add themselves or agency owner adds" on public.conversation_members for insert to authenticated
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.conversations c where c.id = conversation_id and c.created_by = auth.uid())
    or exists (select 1 from public.conversations c where c.id = conversation_id and public.is_agency_owner(c.agency_id))
  );
create policy "Members update own membership" on public.conversation_members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "Members read messages" on public.messages for select to authenticated
  using (public.is_conversation_member(conversation_id));
create policy "Members send messages" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));

alter publication supabase_realtime add table public.messages;

-- ============ OTP (backend only) ============
create table public.otp_requests (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempts integer not null default 0,
  ip text,
  provider text not null default 'unconfigured',
  created_at timestamptz not null default now()
);
create index otp_requests_phone_idx on public.otp_requests(phone, created_at desc);
grant all on public.otp_requests to service_role;
alter table public.otp_requests enable row level security;

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'info',
  title text not null,
  body text not null default '',
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);
grant select, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "Users read own notifications" on public.notifications for select to authenticated
  using (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own notifications" on public.notifications for delete to authenticated
  using (auth.uid() = user_id);