-- =============================================================================
-- P1 #1 Trang hóa đơn cho người thuê + "Tôi đã chuyển"
-- P1 #4 Xoá tài khoản và toàn bộ dữ liệu
-- P1 #6 Tài khoản phụ đọc/ghi sổ của chủ trọ (user_app_state)
-- Chạy lại nhiều lần vẫn an toàn (idempotent).
-- =============================================================================

-- 1. TÀI KHOẢN PHỤ ---------------------------------------------------------------
-- p_write = true: chỉ vai trò 'staff' được ghi; 'viewer' chỉ đọc.
create or replace function public.is_staff_of(p_owner_id uuid, p_write boolean default false)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.property_staff ps
    where ps.owner_id = p_owner_id
      and (ps.staff_user_id = auth.uid() or lower(ps.staff_email) = lower(coalesce(auth.jwt()->>'email', '')))
      and (not p_write or ps.role = 'staff')
  );
$$;

-- ponytail: tài khoản phụ đọc cả khối sổ của chủ trọ (giao diện mới ẩn báo cáo/lợi nhuận);
-- tách bảng chuẩn hoá theo property_id nếu cần giấu dữ liệu ở tầng máy chủ.
drop policy if exists "user_app_state_staff_select" on public.user_app_state;
create policy "user_app_state_staff_select" on public.user_app_state
  for select using (public.is_staff_of(owner_id));

drop policy if exists "user_app_state_staff_update" on public.user_app_state;
create policy "user_app_state_staff_update" on public.user_app_state
  for update using (public.is_staff_of(owner_id, true)) with check (public.is_staff_of(owner_id, true));

-- 2. BÁO "TÔI ĐÃ CHUYỂN" TỪ NGƯỜI THUÊ ----------------------------------------------
create table if not exists public.invoice_payment_reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  public_token text not null,
  invoice_code text not null,
  property_id text not null default '',
  room_code text not null default '',
  amount integer not null check (amount > 0 and amount <= 1000000000),
  payer_note text check (payer_note is null or char_length(payer_note) <= 40),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists invoice_payment_reports_owner_idx
  on public.invoice_payment_reports (owner_id, status);
create index if not exists invoice_payment_reports_token_idx
  on public.invoice_payment_reports (public_token, created_at);

alter table public.invoice_payment_reports enable row level security;

drop policy if exists "payment_reports_owner_all" on public.invoice_payment_reports;
create policy "payment_reports_owner_all" on public.invoice_payment_reports
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "payment_reports_staff_select" on public.invoice_payment_reports;
create policy "payment_reports_staff_select" on public.invoice_payment_reports
  for select using (public.is_staff_of(owner_id));

drop policy if exists "payment_reports_staff_update" on public.invoice_payment_reports;
create policy "payment_reports_staff_update" on public.invoice_payment_reports
  for update using (public.is_staff_of(owner_id, true)) with check (public.is_staff_of(owner_id, true));

create index if not exists user_app_state_invoices_gin
  on public.user_app_state using gin ((state->'invoices') jsonb_path_ops);

-- Xem đúng 1 hóa đơn qua mã ngẫu nhiên: không trả SĐT, CCCD, tên khách.
create or replace function public.get_public_invoice(p_token text)
returns jsonb
language sql
stable
security definer set search_path = public
as $$
  select jsonb_build_object(
    'invoice', (
      select jsonb_object_agg(k, inv->k)
      from unnest(array[
        'code', 'roomCode', 'billingMonth', 'periodLabel', 'issueDate', 'dueDate',
        'rentAmount', 'elecOld', 'elecNew', 'elecUsage', 'elecRate', 'elecAmount',
        'waterOld', 'waterNew', 'waterUsage', 'waterRate', 'waterAmount',
        'trashAmount', 'internetAmount', 'vehicleCount', 'vehicleAmount',
        'totalAmount', 'paidAmount', 'status', 'meterPhoto'
      ]) as k
      where inv ? k
    ),
    'property', (
      select jsonb_build_object(
        'name', p->>'name', 'address', p->>'address',
        'bankBin', p->>'bankBin', 'bankName', p->>'bankName',
        'bankAccount', p->>'bankAccount', 'bankOwner', p->>'bankOwner'
      )
      from jsonb_array_elements(s.state->'properties') p
      where p->>'id' = inv->>'propertyId'
      limit 1
    ),
    'payments', coalesce((
      select jsonb_agg(jsonb_build_object('date', t->>'date', 'amount', (t->>'amount')::bigint) order by t->>'isoDate')
      from jsonb_array_elements(s.state->'transactions') t
      where t->>'invoiceCode' = inv->>'code' and t->>'type' = 'income'
    ), '[]'::jsonb),
    'reports', coalesce((
      select jsonb_agg(jsonb_build_object('amount', r.amount, 'createdAt', r.created_at, 'status', r.status) order by r.created_at)
      from public.invoice_payment_reports r
      where r.public_token = p_token
    ), '[]'::jsonb)
  )
  from public.user_app_state s
  cross join lateral jsonb_array_elements(s.state->'invoices') inv
  where char_length(coalesce(p_token, '')) >= 24
    and s.state->'invoices' @> jsonb_build_array(jsonb_build_object('publicToken', p_token))
    and inv->>'publicToken' = p_token
  limit 1;
$$;

-- "Tôi đã chuyển": chỉ là lời báo, không tự gạch nợ. Tối đa 3 lần/ngày/hóa đơn.
create or replace function public.report_invoice_paid(p_token text, p_amount integer, p_note text default null)
returns jsonb
language plpgsql
volatile
security definer set search_path = public
as $$
declare
  v_owner uuid;
  v_inv jsonb;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if char_length(coalesce(p_token, '')) < 24 then
    raise exception 'INVOICE_NOT_FOUND';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 1000000000 then
    raise exception 'INVALID_AMOUNT';
  end if;
  if v_note is not null and char_length(v_note) > 40 then
    raise exception 'NOTE_TOO_LONG';
  end if;

  select s.owner_id, inv into v_owner, v_inv
  from public.user_app_state s
  cross join lateral jsonb_array_elements(s.state->'invoices') inv
  where s.state->'invoices' @> jsonb_build_array(jsonb_build_object('publicToken', p_token))
    and inv->>'publicToken' = p_token
  limit 1;

  if v_owner is null then
    raise exception 'INVOICE_NOT_FOUND';
  end if;

  if (
    select count(*) from public.invoice_payment_reports r
    where r.public_token = p_token and r.created_at > now() - interval '1 day'
  ) >= 3 then
    raise exception 'TOO_MANY_REPORTS';
  end if;

  insert into public.invoice_payment_reports (owner_id, public_token, invoice_code, property_id, room_code, amount, payer_note)
  values (v_owner, p_token, v_inv->>'code', coalesce(v_inv->>'propertyId', ''), coalesce(v_inv->>'roomCode', ''), p_amount, v_note);

  return public.get_public_invoice(p_token);
end;
$$;

revoke all on function public.get_public_invoice(text) from public;
revoke all on function public.report_invoice_paid(text, integer, text) from public;
grant execute on function public.get_public_invoice(text) to anon, authenticated;
grant execute on function public.report_invoice_paid(text, integer, text) to anon, authenticated;

-- 3. XOÁ TÀI KHOẢN (Luật BVDLCN) ---------------------------------------------------
-- Xoá auth.users kéo theo mọi bảng có "on delete cascade".
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;
