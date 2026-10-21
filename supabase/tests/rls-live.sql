-- Live RLS check against the real Supabase DB. Paste the whole file into the SQL Editor and run it.
-- Success ends with the deliberate error "ALL RLS CHECKS PASSED", which aborts the transaction so nothing is kept.
begin;
insert into auth.users (id, email, aud, role) values
 ('11111111-0000-4000-8000-00000000000a','rlstest-a@example.invalid','authenticated','authenticated'),
 ('11111111-0000-4000-8000-00000000000b','rlstest-b@example.invalid','authenticated','authenticated'),
 ('11111111-0000-4000-8000-00000000000c','rlstest-s@example.invalid','authenticated','authenticated'),
 ('11111111-0000-4000-8000-00000000000d','rlstest-v@example.invalid','authenticated','authenticated');
insert into public.user_app_state (owner_id, state) values
 ('11111111-0000-4000-8000-00000000000a', '{"properties":[{"id":"p1","name":"Nha a","bankAccount":"0123"}],"invoices":[{"id":"i1","code":"HD-1","propertyId":"p1","roomCode":"P101","tenantName":"X","tenantPhone":"0900","totalAmount":3000000,"paidAmount":1000000,"status":"partial","publicToken":"rlstest_xxxxxxxxxxxxxxxxxxxxxxxx"}],"transactions":[]}'),
 ('11111111-0000-4000-8000-00000000000b', '{"properties":[{"id":"p1","name":"Nha b"}],"invoices":[],"transactions":[]}')
on conflict (owner_id) do update set state = excluded.state;
insert into public.property_staff (owner_id, property_id, staff_email, role) values
 ('11111111-0000-4000-8000-00000000000a','p1','RLSTEST-S@example.invalid','staff'),
 ('11111111-0000-4000-8000-00000000000a','p1','rlstest-v@example.invalid','viewer');

-- A
select set_config('request.jwt.claim.sub','11111111-0000-4000-8000-00000000000a',true),
       set_config('request.jwt.claims','{"sub":"11111111-0000-4000-8000-00000000000a","email":"rlstest-a@example.invalid","role":"authenticated"}',true);
set local role authenticated;
do $$ declare n int; begin
  select count(*) into n from public.user_app_state; if n <> 1 then raise exception 'FAIL A sees % rows', n; end if;
  update public.user_app_state set state='{}' where owner_id='11111111-0000-4000-8000-00000000000b'; get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL A updated B'; end if;
  delete from public.user_app_state where owner_id='11111111-0000-4000-8000-00000000000b'; get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL A deleted B'; end if;
end $$;
reset role;

-- B
select set_config('request.jwt.claim.sub','11111111-0000-4000-8000-00000000000b',true),
       set_config('request.jwt.claims','{"sub":"11111111-0000-4000-8000-00000000000b","email":"rlstest-b@example.invalid","role":"authenticated"}',true);
set local role authenticated;
do $$ declare n int; begin
  select count(*) into n from public.user_app_state where owner_id='11111111-0000-4000-8000-00000000000a'; if n <> 0 then raise exception 'FAIL B sees A'; end if;
  select count(*) into n from public.property_staff; if n <> 0 then raise exception 'FAIL B sees staff rows'; end if;
end $$;
reset role;

-- Staff S: read + write A
select set_config('request.jwt.claim.sub','11111111-0000-4000-8000-00000000000c',true),
       set_config('request.jwt.claims','{"sub":"11111111-0000-4000-8000-00000000000c","email":"rlstest-s@example.invalid","role":"authenticated"}',true);
set local role authenticated;
do $$ declare n int; begin
  select count(*) into n from public.user_app_state where owner_id='11111111-0000-4000-8000-00000000000a'; if n <> 1 then raise exception 'FAIL staff cannot read A'; end if;
  update public.user_app_state set state = state || '{"x":1}' where owner_id='11111111-0000-4000-8000-00000000000a'; get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL staff cannot write A'; end if;
  delete from public.user_app_state where owner_id='11111111-0000-4000-8000-00000000000a'; get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL staff deleted A'; end if;
end $$;
reset role;

-- Viewer V: read only
select set_config('request.jwt.claim.sub','11111111-0000-4000-8000-00000000000d',true),
       set_config('request.jwt.claims','{"sub":"11111111-0000-4000-8000-00000000000d","email":"rlstest-v@example.invalid","role":"authenticated"}',true);
set local role authenticated;
do $$ declare n int; begin
  select count(*) into n from public.user_app_state where owner_id='11111111-0000-4000-8000-00000000000a'; if n <> 1 then raise exception 'FAIL viewer cannot read A'; end if;
  update public.user_app_state set state='{}' where owner_id='11111111-0000-4000-8000-00000000000a'; get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL viewer wrote A'; end if;
end $$;
reset role;

-- Anon: public invoice + report
select set_config('request.jwt.claim.sub','',true), set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $$ declare j jsonb; n int; begin
  select count(*) into n from public.user_app_state; if n <> 0 then raise exception 'FAIL anon reads state'; end if;
  j := public.get_public_invoice('rlstest_xxxxxxxxxxxxxxxxxxxxxxxx');
  if j->'invoice'->>'code' <> 'HD-1' then raise exception 'FAIL public invoice %', j; end if;
  if j->'invoice' ? 'tenantPhone' or j->'invoice' ? 'tenantName' then raise exception 'FAIL public invoice leaks tenant'; end if;
  j := public.report_invoice_paid('rlstest_xxxxxxxxxxxxxxxxxxxxxxxx', 2000000, 'test');
  if jsonb_array_length(j->'reports') <> 1 then raise exception 'FAIL report %', j; end if;
  select count(*) into n from public.invoice_payment_reports; if n <> 0 then raise exception 'FAIL anon reads reports'; end if;
end $$;
reset role;

-- A sees the report, B does not
select set_config('request.jwt.claim.sub','11111111-0000-4000-8000-00000000000b',true),
       set_config('request.jwt.claims','{"sub":"11111111-0000-4000-8000-00000000000b","email":"rlstest-b@example.invalid","role":"authenticated"}',true);
set local role authenticated;
do $$ declare n int; begin select count(*) into n from public.invoice_payment_reports; if n <> 0 then raise exception 'FAIL B sees reports'; end if; end $$;
reset role;
select set_config('request.jwt.claim.sub','11111111-0000-4000-8000-00000000000a',true),
       set_config('request.jwt.claims','{"sub":"11111111-0000-4000-8000-00000000000a","email":"rlstest-a@example.invalid","role":"authenticated"}',true);
set local role authenticated;
do $$ declare n int; begin select count(*) into n from public.invoice_payment_reports; if n <> 1 then raise exception 'FAIL A sees % reports', n; end if; end $$;
-- Delete account removes A only
select public.delete_my_account();
reset role;
do $$ declare n int; begin
  select count(*) into n from auth.users where id='11111111-0000-4000-8000-00000000000a'; if n <> 0 then raise exception 'FAIL A not deleted'; end if;
  select count(*) into n from public.user_app_state where owner_id='11111111-0000-4000-8000-00000000000b'; if n <> 1 then raise exception 'FAIL B lost'; end if;
  raise exception 'ALL RLS CHECKS PASSED (rolled back on purpose)';
end $$;
rollback;
