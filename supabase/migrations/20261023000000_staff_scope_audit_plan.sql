-- =============================================================================
-- Premium #6 Phân quyền theo khu: tài khoản phụ chỉ đọc/ghi dữ liệu các khu được cấp (chặn ở máy chủ).
-- Premium #7 Nhật ký thao tác: ai làm gì, lúc nào; chỉ chủ trọ xem, không ai sửa/xoá được.
-- Gói trả phí: người dùng không tự sửa được plan_tier / hạn dùng (chỉ quản trị bằng service_role).
-- Chạy lại nhiều lần vẫn an toàn (idempotent).
-- =============================================================================

-- 1. PHÂN QUYỀN THEO KHU -----------------------------------------------------------
-- Bỏ quyền đọc/ghi cả khối sổ của tài khoản phụ; thay bằng 2 hàm chỉ trả/nhận đúng các khu được cấp.
drop policy if exists "user_app_state_staff_select" on public.user_app_state;
drop policy if exists "user_app_state_staff_update" on public.user_app_state;

create or replace function public.staff_property_ids_(p_owner uuid, p_write boolean)
returns text[]
language sql
stable
security definer set search_path = public
as $$
  select coalesce(array_agg(distinct ps.property_id), '{}')
  from public.property_staff ps
  where ps.owner_id = p_owner
    and (ps.staff_user_id = auth.uid() or lower(ps.staff_email) = lower(coalesce(auth.jwt()->>'email', '')))
    and (not p_write or ps.role = 'staff');
$$;

-- Lọc 1 mảng trong sổ: p_inside = true giữ phần tử thuộc p_ids, false giữ phần tử ngoài p_ids.
create or replace function public.scope_items_(p_items jsonb, p_key text, p_ids text[], p_inside boolean)
returns jsonb
language sql
immutable
as $$
  select coalesce(jsonb_agg(e), '[]'::jsonb)
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) e
  where (coalesce(case when p_key = 'properties' then e->>'id' else e->>'propertyId' end, '') = any(p_ids)) = p_inside;
$$;

create or replace function public.staff_load_state(p_owner uuid)
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_ids text[] := public.staff_property_ids_(p_owner, false);
  v_row public.user_app_state;
  v_state jsonb := '{}'::jsonb;
  k text;
begin
  if cardinality(v_ids) = 0 then
    raise exception 'FORBIDDEN';
  end if;
  select * into v_row from public.user_app_state where owner_id = p_owner;
  if v_row.owner_id is null then
    return null;
  end if;
  foreach k in array array['properties', 'rooms', 'tenants', 'vehicles', 'contracts', 'invoices', 'transactions'] loop
    v_state := v_state || jsonb_build_object(k, public.scope_items_(v_row.state->k, k, v_ids, true));
  end loop;
  return jsonb_build_object('state', v_state, 'updated_at', v_row.updated_at);
end;
$$;

-- Ghi: giữ nguyên dữ liệu các khu khác của chủ trọ, chỉ thay phần thuộc khu được cấp.
-- Trả về updated_at mới; null = sổ đã đổi từ phiên bản p_version (xung đột).
create or replace function public.staff_save_state(p_owner uuid, p_state jsonb, p_version timestamptz)
returns timestamptz
language plpgsql
volatile
security definer set search_path = public
as $$
declare
  v_ids text[] := public.staff_property_ids_(p_owner, true);
  v_cur jsonb;
  v_ver timestamptz;
  k text;
begin
  if cardinality(v_ids) = 0 then
    raise exception 'FORBIDDEN';
  end if;
  select state, updated_at into v_cur, v_ver from public.user_app_state where owner_id = p_owner for update;
  if v_cur is null or v_ver is distinct from p_version then
    return null;
  end if;
  foreach k in array array['properties', 'rooms', 'tenants', 'vehicles', 'contracts', 'invoices', 'transactions'] loop
    v_cur := jsonb_set(v_cur, array[k],
      public.scope_items_(v_cur->k, k, v_ids, false) || public.scope_items_(p_state->k, k, v_ids, true));
  end loop;
  update public.user_app_state set state = v_cur, updated_at = now()
  where owner_id = p_owner
  returning updated_at into v_ver;
  return v_ver;
end;
$$;

revoke all on function public.staff_property_ids_(uuid, boolean) from public, anon, authenticated;
revoke all on function public.scope_items_(jsonb, text, text[], boolean) from public, anon, authenticated;
revoke all on function public.staff_load_state(uuid) from public, anon;
revoke all on function public.staff_save_state(uuid, jsonb, timestamptz) from public, anon;
grant execute on function public.staff_load_state(uuid) to authenticated;
grant execute on function public.staff_save_state(uuid, jsonb, timestamptz) to authenticated;

-- 2. NHẬT KÝ THAO TÁC -----------------------------------------------------------------
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid not null default auth.uid(),
  actor_email text not null default coalesce(auth.jwt()->>'email', ''),
  property_id text not null default '',
  action text not null check (char_length(action) between 1 and 40),
  detail text not null default '' check (char_length(detail) <= 300),
  created_at timestamptz not null default now()
);

create index if not exists audit_log_owner_idx on public.audit_log (owner_id, created_at desc);

alter table public.audit_log enable row level security;

-- Chỉ ghi dưới tên chính mình, vào sổ mình có quyền ghi. Không có policy update/delete: không sửa/xoá được.
drop policy if exists "audit_log_insert" on public.audit_log;
create policy "audit_log_insert" on public.audit_log
  for insert with check (
    actor_id = auth.uid()
    and actor_email = coalesce(auth.jwt()->>'email', '')
    and (auth.uid() = owner_id or public.is_staff_of(owner_id, true))
  );

drop policy if exists "audit_log_owner_select" on public.audit_log;
create policy "audit_log_owner_select" on public.audit_log
  for select using (auth.uid() = owner_id);

-- 3. GÓI TRẢ PHÍ: CHỈ QUẢN TRỊ ĐƯỢC ĐỔI ----------------------------------------------
alter table public.profiles add column if not exists plan_expires_at timestamptz;

revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
