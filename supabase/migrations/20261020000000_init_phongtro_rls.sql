-- =============================================================================
-- QUẢN LÝ PHÒNG TRỌ — SUPABASE POSTGRESQL SCHEMA + ROW LEVEL SECURITY (RLS)
-- Project Ref: ymdnvpdgdpdjnqnraklg (https://ymdnvpdgdpdjnqnraklg.supabase.co)
-- Mô hình phân quyền 3 cấp:
--   1. Chủ trọ (Owner - auth.uid() = owner_id): Toàn quyền trên mọi cơ sở của mình
--   2. Quản lý / Người nhà (Staff - property_staff): Ghi điện nước, hóa đơn, thu tiền
--   3. Người thuê (Tenant - public_invoice_token): Xem đúng 1 hóa đơn qua RPC bảo mật
-- =============================================================================

create extension if not exists "pgcrypto";

-- 1. HỒ SƠ CHỦ TRỌ & GÓI CƯỚC (PROFILES)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  plan_tier text not null default 'free' check (plan_tier in ('free', 'standard', 'pro', 'enterprise')),
  max_rooms integer not null default 10,
  max_properties integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Tự động tạo profile khi người dùng đăng ký qua Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. CƠ SỞ / KHU TRỌ (PROPERTIES)
create table if not exists public.properties (
  id text not null,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  address text not null default '',
  electricity_rate integer not null default 3500,
  water_rate integer not null default 18000,
  trash_fee integer not null default 30000,
  internet_fee integer not null default 100000,
  vehicle_fee integer not null default 100000,
  bank_bin text not null default '970436',
  bank_name text not null default 'Vietcombank',
  bank_account text not null default '',
  bank_owner text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

alter table public.properties enable row level security;

-- 3. PHÂN QUYỀN TÀI KHOẢN PHỤ CHO QUẢN LÝ / NGƯỜI NHÀ (PROPERTY_STAFF)
create table if not exists public.property_staff (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  property_id text not null,
  staff_email text not null,
  staff_user_id uuid references auth.users(id) on delete set null,
  role text not null default 'staff' check (role in ('staff', 'viewer')),
  can_record_meters boolean not null default true,
  can_collect_payments boolean not null default true,
  can_view_reports boolean not null default false,
  created_at timestamptz not null default now(),
  unique (owner_id, property_id, staff_email)
);

alter table public.property_staff enable row level security;

-- Hàm kiểm tra người dùng hiện tại là Chủ trọ hoặc Quản lý được cấp quyền của khu trọ
create or replace function public.can_access_property(p_owner_id uuid, p_property_id text)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select
    auth.uid() = p_owner_id
    or exists (
      select 1
      from public.property_staff ps
      where ps.owner_id = p_owner_id
        and ps.property_id = p_property_id
        and (ps.staff_user_id = auth.uid() or lower(ps.staff_email) = lower(auth.jwt()->>'email'))
    );
$$;

-- Policies cho properties & property_staff
drop policy if exists "properties_owner_all" on public.properties;
create policy "properties_owner_all" on public.properties
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "properties_staff_select" on public.properties;
create policy "properties_staff_select" on public.properties
  for select using (public.can_access_property(owner_id, id));

drop policy if exists "property_staff_owner_all" on public.property_staff;
create policy "property_staff_owner_all" on public.property_staff
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "property_staff_self_select" on public.property_staff;
create policy "property_staff_self_select" on public.property_staff
  for select using (
    staff_user_id = auth.uid()
    or lower(staff_email) = lower(auth.jwt()->>'email')
  );

-- 4. DANH SÁCH PHÒNG (ROOMS)
create table if not exists public.rooms (
  id text not null,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  property_id text not null,
  code text not null,
  floor integer not null default 1,
  price integer not null default 0,
  deposit integer not null default 0,
  status text not null default 'vacant',
  tenant_id text,
  tenant_name text,
  tenant_phone text,
  contract_code text,
  elec_index integer not null default 0,
  water_index integer not null default 0,
  trash_fee integer not null default 0,
  internet_fee integer not null default 0,
  vehicle_count integer not null default 0,
  notes text,
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

alter table public.rooms enable row level security;

drop policy if exists "rooms_access_policy" on public.rooms;
create policy "rooms_access_policy" on public.rooms
  for all
  using (public.can_access_property(owner_id, property_id))
  with check (public.can_access_property(owner_id, property_id));

-- 5. KHÁCH THUÊ (TENANTS)
create table if not exists public.tenants (
  id text not null,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  code text not null,
  property_id text not null,
  name text not null,
  phone text not null default '',
  cccd text not null default '',
  room_code text not null default '',
  contract_code text not null default '',
  contract_end_date text not null default '',
  role text not null default 'representative',
  status text not null default 'active',
  has_cccd_photo boolean not null default false,
  cccd_front_url text,
  dob text,
  hometown text,
  temp_residence_declared boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

alter table public.tenants enable row level security;

drop policy if exists "tenants_access_policy" on public.tenants;
create policy "tenants_access_policy" on public.tenants
  for all
  using (public.can_access_property(owner_id, property_id))
  with check (public.can_access_property(owner_id, property_id));

-- 6. DANH SÁCH XE (VEHICLES)
create table if not exists public.vehicles (
  id text not null,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  property_id text not null,
  plate text not null,
  owner_name text not null default '',
  phone text not null default '',
  room_code text not null default '',
  vehicle_type text not null default 'Xe máy',
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

alter table public.vehicles enable row level security;

drop policy if exists "vehicles_access_policy" on public.vehicles;
create policy "vehicles_access_policy" on public.vehicles
  for all
  using (public.can_access_property(owner_id, property_id))
  with check (public.can_access_property(owner_id, property_id));

-- 7. HỢP ĐỒNG THUÊ PHÒNG (CONTRACTS)
create table if not exists public.contracts (
  id text not null,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  code text not null,
  property_id text not null,
  room_code text not null,
  tenant_id text not null,
  tenant_name text not null,
  tenant_phone text not null default '',
  co_tenant_names jsonb not null default '[]'::jsonb,
  start_date text not null,
  end_date text not null,
  sign_date text not null,
  payment_cycle text not null default '1 tháng/lần',
  billing_cycle text not null default 'calendar_month',
  rent_amount integer not null default 0,
  deposit_amount integer not null default 0,
  deposit_mode text not null default 'received_today',
  status text not null default 'active',
  days_remaining integer not null default 0,
  move_out_date text,
  deposit_deducted integer,
  deposit_refund_amount integer,
  refund_bank_account text,
  refund_bank_name text,
  deposit_refunded boolean default false,
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

alter table public.contracts enable row level security;

drop policy if exists "contracts_access_policy" on public.contracts;
create policy "contracts_access_policy" on public.contracts
  for all
  using (public.can_access_property(owner_id, property_id))
  with check (public.can_access_property(owner_id, property_id));

-- 8. HÓA ĐƠN & PHIẾU BÁO ZALO (INVOICES)
create table if not exists public.invoices (
  id text not null,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  code text not null,
  property_id text not null,
  room_code text not null,
  floor integer not null default 1,
  tenant_name text not null,
  tenant_phone text not null default '',
  contract_code text not null default '',
  billing_month text not null,
  period_label text not null,
  issue_date text not null,
  due_date text not null,
  rent_amount integer not null default 0,
  elec_old integer not null default 0,
  elec_new integer not null default 0,
  elec_usage integer not null default 0,
  elec_rate integer not null default 0,
  elec_amount integer not null default 0,
  water_old integer not null default 0,
  water_new integer not null default 0,
  water_usage integer not null default 0,
  water_rate integer not null default 0,
  water_amount integer not null default 0,
  trash_amount integer not null default 0,
  internet_amount integer not null default 0,
  vehicle_count integer not null default 0,
  vehicle_amount integer not null default 0,
  total_amount integer not null default 0,
  paid_amount integer not null default 0,
  status text not null default 'unpaid',
  sent_zalo boolean not null default false,
  is_overdue boolean not null default false,
  meter_photo text,
  -- Token ngẫu nhiên để người thuê xem hóa đơn trên Zalo mà không cần tài khoản
  public_token text not null default encode(gen_random_bytes(16), 'hex'),
  tenant_reported_paid_amount integer,
  tenant_reported_payer_note text,
  tenant_reported_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

alter table public.invoices enable row level security;

drop policy if exists "invoices_access_policy" on public.invoices;
create policy "invoices_access_policy" on public.invoices
  for all
  using (public.can_access_property(owner_id, property_id))
  with check (public.can_access_property(owner_id, property_id));

-- 9. SỔ THU CHI & LỊCH SỬ GẠCH NỢ FIFO (TRANSACTIONS)
create table if not exists public.transactions (
  id text not null,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  property_id text not null,
  date text not null,
  iso_date text not null,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  room_code text,
  invoice_code text,
  description text not null default '',
  amount integer not null default 0,
  method text not null default 'Chuyển khoản',
  bill_image text,
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

alter table public.transactions enable row level security;

drop policy if exists "transactions_access_policy" on public.transactions;
create policy "transactions_access_policy" on public.transactions
  for all
  using (public.can_access_property(owner_id, property_id))
  with check (public.can_access_property(owner_id, property_id));

-- 10. BẢNG ĐỒNG BỘ TRẠNG THÁI NHANH CHO MỖI CHỦ TRỌ (USER_APP_STATE)
-- Cho phép đồng bộ toàn bộ state của chủ trọ lên đám mây chỉ với 1 truy vấn
create table if not exists public.user_app_state (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  schema_version text not null default 'quanlyphongtro-web-v1',
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_app_state enable row level security;

drop policy if exists "user_app_state_owner_only" on public.user_app_state;
create policy "user_app_state_owner_only" on public.user_app_state
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
