// Test RLS bằng Postgres thật chạy trong tiến trình (PGlite), không cần Docker hay project Supabase.
// Giả lập tối thiểu những gì Supabase có sẵn: schema auth, auth.uid(), auth.jwt(), vai trò anon/authenticated.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const MIGRATIONS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';
const S = '00000000-0000-0000-0000-00000000000c'; // tài khoản phụ của A
const V = '00000000-0000-0000-0000-00000000000d'; // người xem (viewer) của A
const EMAIL = { [A]: 'a@test.vn', [B]: 'b@test.vn', [S]: 'staff@test.vn', [V]: 'viewer@test.vn' };
const TOKEN = 'tok_' + 'x'.repeat(28);

const SUPABASE_STUB = `
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema public, auth to anon, authenticated;
`;

async function setup() {
  const db = await PGlite.create({ extensions: { pgcrypto } });
  await db.exec(SUPABASE_STUB);
  for (const f of fs.readdirSync(MIGRATIONS).filter((x) => x.endsWith('.sql')).sort()) {
    await db.exec(fs.readFileSync(path.join(MIGRATIONS, f), 'utf8'));
  }
  // Supabase cấp sẵn quyền bảng cho anon/authenticated; RLS mới là lớp chặn thật.
  await db.exec(`
    grant all on all tables in schema public to anon, authenticated;
    grant execute on function public.can_access_property(uuid, text), public.is_staff_of(uuid, boolean) to anon, authenticated;
  `);
  for (const id of [A, B, S, V]) {
    await db.query('insert into auth.users (id, email) values ($1, $2)', [id, EMAIL[id]]);
  }
  const state = (owner) => ({
    properties: [{ id: 'p1', name: 'Nhà ' + owner.slice(-1), address: 'HN', bankBin: '970436', bankName: 'VCB', bankAccount: '0123', bankOwner: 'CHU TRO' }],
    invoices: owner === A
      ? [{ id: 'i1', code: 'HD-1', propertyId: 'p1', roomCode: 'P101', tenantName: 'Nguyễn Văn An', tenantPhone: '0900000000', totalAmount: 3000000, paidAmount: 1000000, status: 'partial', publicToken: TOKEN }]
      : [],
    transactions: owner === A
      ? [{ id: 't1', propertyId: 'p1', type: 'income', invoiceCode: 'HD-1', date: '05/10/2026', isoDate: '2026-10-05', amount: 1000000 }]
      : [],
  });
  await db.query('insert into public.user_app_state (owner_id, state) values ($1, $2), ($3, $4)', [A, state(A), B, state(B)]);
  await db.query(`insert into public.property_staff (owner_id, property_id, staff_email, role) values ($1, 'p1', 'STAFF@test.vn', 'staff'), ($1, 'p1', 'viewer@test.vn', 'viewer')`, [A]);
  return db;
}

/** Chạy `fn` dưới vai trò `role` với JWT của `uid` (null = khách vô danh), rồi trả về vai trò siêu người dùng. */
async function as(db, uid, fn) {
  const role = uid ? 'authenticated' : 'anon';
  const claims = uid ? JSON.stringify({ sub: uid, email: EMAIL[uid], role }) : '';
  await db.query(`select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claims', $2, false)`, [uid ?? '', claims]);
  await db.exec(`set role ${role}`);
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
  }
}

const owners = async (db) => (await db.query('select owner_id from public.user_app_state order by owner_id')).rows.map((r) => r.owner_id);

test('RLS: chủ trọ A chỉ thấy sổ của A, không đọc/ghi/xoá được sổ của B', async () => {
  const db = await setup();
  await as(db, A, async () => {
    assert.deepEqual(await owners(db), [A]);
    const upd = await db.query(`update public.user_app_state set state = '{}'::jsonb where owner_id = $1`, [B]);
    assert.equal(upd.affectedRows, 0);
    const del = await db.query('delete from public.user_app_state where owner_id = $1', [B]);
    assert.equal(del.affectedRows, 0);
    await assert.rejects(db.query(`insert into public.user_app_state (owner_id, state) values ($1, '{}')`, [B]), /row-level security/);
  });
  await as(db, B, async () => {
    assert.deepEqual(await owners(db), [B]);
    assert.equal((await db.query('select * from public.property_staff')).rows.length, 0);
  });
  const bState = (await db.query('select state from public.user_app_state where owner_id = $1', [B])).rows[0].state;
  assert.equal(bState.properties[0].name, 'Nhà b');
});

test('RLS: khách vô danh không đọc được bảng nào', async () => {
  const db = await setup();
  await as(db, null, async () => {
    for (const t of ['user_app_state', 'property_staff', 'profiles', 'properties', 'rooms', 'invoices', 'transactions', 'invoice_payment_reports']) {
      assert.equal((await db.query(`select * from public.${t}`)).rows.length, 0, t);
    }
  });
});

test('RLS: bảng chuẩn hoá (rooms) tách theo chủ trọ', async () => {
  const db = await setup();
  await as(db, A, () => db.query(`insert into public.rooms (id, owner_id, property_id, code) values ('r1', $1, 'p1', 'P101')`, [A]));
  await as(db, B, async () => {
    assert.equal((await db.query('select * from public.rooms')).rows.length, 0);
    await assert.rejects(db.query(`insert into public.rooms (id, owner_id, property_id, code) values ('r2', $1, 'p1', 'P102')`, [A]), /row-level security/);
  });
  await as(db, S, async () => assert.equal((await db.query('select * from public.rooms')).rows.length, 1));
});

test('Tài khoản phụ: staff đọc + ghi sổ của A (email không phân biệt hoa thường), viewer chỉ đọc', async () => {
  const db = await setup();
  await as(db, S, async () => {
    assert.deepEqual(await owners(db), [A]);
    const upd = await db.query(`update public.user_app_state set state = state || '{"x":1}'::jsonb where owner_id = $1`, [A]);
    assert.equal(upd.affectedRows, 1);
    // Không được tự thêm mình vào khu khác hay xoá sổ
    assert.equal((await db.query('delete from public.user_app_state where owner_id = $1', [A])).affectedRows, 0);
    await assert.rejects(db.query(`insert into public.property_staff (owner_id, property_id, staff_email) values ($1, 'p2', 'staff@test.vn')`, [A]), /row-level security/);
  });
  await as(db, V, async () => {
    assert.deepEqual(await owners(db), [A]);
    const upd = await db.query(`update public.user_app_state set state = '{}'::jsonb where owner_id = $1`, [A]);
    assert.equal(upd.affectedRows, 0);
  });
});

test('Hóa đơn công khai: chỉ trả đúng hóa đơn theo mã, không lộ SĐT/tên khách; mã sai trả null', async () => {
  const db = await setup();
  await as(db, null, async () => {
    const r = (await db.query('select public.get_public_invoice($1) as j', [TOKEN])).rows[0].j;
    assert.equal(r.invoice.code, 'HD-1');
    assert.equal(r.invoice.totalAmount, 3000000);
    assert.equal(r.invoice.tenantPhone, undefined);
    assert.equal(r.invoice.tenantName, undefined);
    assert.equal(r.property.bankAccount, '0123');
    assert.deepEqual(r.payments, [{ date: '05/10/2026', amount: 1000000 }]);
    assert.equal((await db.query('select public.get_public_invoice($1) as j', ['tok_' + 'y'.repeat(28)])).rows[0].j, null);
    assert.equal((await db.query('select public.get_public_invoice($1) as j', ['short'])).rows[0].j, null);
  });
});

test('"Tôi đã chuyển": ghi lời báo cho đúng chủ trọ, chặn ghi chú dài, giới hạn 3 lần/ngày, không tự gạch nợ', async () => {
  const db = await setup();
  await as(db, null, async () => {
    const r = (await db.query('select public.report_invoice_paid($1, $2, $3) as j', [TOKEN, 2000000, 'Mẹ chuyển hộ'])).rows[0].j;
    assert.equal(r.reports.length, 1);
    assert.equal(r.invoice.paidAmount, 1000000);
    await assert.rejects(db.query('select public.report_invoice_paid($1, $2, $3)', [TOKEN, 1, 'x'.repeat(41)]), /NOTE_TOO_LONG/);
    await assert.rejects(db.query('select public.report_invoice_paid($1, $2)', [TOKEN, 0]), /INVALID_AMOUNT/);
    await assert.rejects(db.query('select public.report_invoice_paid($1, $2)', ['tok_' + 'z'.repeat(28), 5]), /INVOICE_NOT_FOUND/);
    await db.query('select public.report_invoice_paid($1, $2)', [TOKEN, 5]);
    await db.query('select public.report_invoice_paid($1, $2)', [TOKEN, 5]);
    await assert.rejects(db.query('select public.report_invoice_paid($1, $2)', [TOKEN, 5]), /TOO_MANY_REPORTS/);
    assert.equal((await db.query('select * from public.invoice_payment_reports')).rows.length, 0);
  });
  await as(db, A, async () => {
    const rows = (await db.query('select invoice_code, room_code, amount, payer_note from public.invoice_payment_reports order by amount desc')).rows;
    assert.equal(rows.length, 3);
    assert.deepEqual(rows[0], { invoice_code: 'HD-1', room_code: 'P101', amount: 2000000, payer_note: 'Mẹ chuyển hộ' });
  });
  await as(db, B, async () => assert.equal((await db.query('select * from public.invoice_payment_reports')).rows.length, 0));
  await as(db, S, async () => assert.equal((await db.query('select * from public.invoice_payment_reports')).rows.length, 3));
});

test('Xoá tài khoản: xoá sạch dữ liệu của chính mình, không đụng B; khách vô danh không gọi được', async () => {
  const db = await setup();
  await as(db, null, () => assert.rejects(db.query('select public.delete_my_account()'), /permission denied/));
  await as(db, A, () => db.query('select public.delete_my_account()'));
  assert.deepEqual(await owners(db), [B]);
  assert.equal((await db.query('select * from public.property_staff')).rows.length, 0);
  assert.equal((await db.query('select * from auth.users where id = $1', [A])).rows.length, 0);
});
