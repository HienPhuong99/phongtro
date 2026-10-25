-- =============================================================================
-- Sửa lỗi bảo mật (rà soát 25/10/2026). Chạy lại nhiều lần vẫn an toàn.
-- 1. Tài khoản phụ không được sửa thông tin khu (tên, số tài khoản nhận tiền...):
--    trước đây staff đổi được bankAccount -> người thuê chuyển tiền vào tài khoản của staff.
-- 2. Lời báo "Tôi đã chuyển": tài khoản phụ chỉ thấy/xử lý lời báo của khu được cấp.
-- =============================================================================

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
  -- 'properties' cố ý không có trong danh sách: chỉ chủ trọ sửa được thông tin khu
  foreach k in array array['rooms', 'tenants', 'vehicles', 'contracts', 'invoices', 'transactions'] loop
    v_cur := jsonb_set(v_cur, array[k],
      public.scope_items_(v_cur->k, k, v_ids, false) || public.scope_items_(p_state->k, k, v_ids, true));
  end loop;
  update public.user_app_state set state = v_cur, updated_at = now()
  where owner_id = p_owner
  returning updated_at into v_ver;
  return v_ver;
end;
$$;

revoke all on function public.staff_save_state(uuid, jsonb, timestamptz) from public, anon;
grant execute on function public.staff_save_state(uuid, jsonb, timestamptz) to authenticated;

-- Policy chạy dưới quyền người gọi nên cần quyền execute; hàm chỉ trả các khu của chính người gọi.
grant execute on function public.staff_property_ids_(uuid, boolean) to anon, authenticated;

drop policy if exists "payment_reports_staff_select" on public.invoice_payment_reports;
create policy "payment_reports_staff_select" on public.invoice_payment_reports
  for select using (property_id = any(public.staff_property_ids_(owner_id, false)));

drop policy if exists "payment_reports_staff_update" on public.invoice_payment_reports;
create policy "payment_reports_staff_update" on public.invoice_payment_reports
  for update
  using (property_id = any(public.staff_property_ids_(owner_id, true)))
  with check (property_id = any(public.staff_property_ids_(owner_id, true)));
