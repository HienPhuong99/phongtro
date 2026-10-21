import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshotToSheets } from './exportData.ts';
import { emptySnapshot } from './cloudSync.ts';
import type { Invoice, Tenant } from '../types.ts';

test('snapshotToSheets: đủ 7 bảng, mỗi dòng đúng số cột với tiêu đề, còn nợ tính sẵn', () => {
  const s = emptySnapshot('chu@tro.vn');
  s.invoices = [{ code: 'HD-1', totalAmount: 3000000, paidAmount: 1000000, propertyId: 'prop-1' } as Invoice];
  s.tenants = [{ name: 'An', role: 'representative', tempResidenceDeclared: false } as Tenant];
  const sheets = snapshotToSheets(s);
  assert.deepEqual(sheets.map((x) => x.name), ['CoSo', 'Phong', 'KhachThue', 'Xe', 'HopDong', 'HoaDon', 'SoThuChi']);
  for (const sh of sheets) for (const row of sh.rows) assert.equal(row.length, sh.rows[0].length, sh.name);
  const hd = sheets.find((x) => x.name === 'HoaDon')!;
  assert.equal(hd.rows[1][hd.rows[0].indexOf('Còn nợ')], 2000000);
  const kh = sheets.find((x) => x.name === 'KhachThue')!;
  assert.equal(kh.rows[1][kh.rows[0].indexOf('Vai trò')], 'Đại diện');
  assert.equal(sheets[0].rows[1][1], 'Nhà trọ của chu');
});
