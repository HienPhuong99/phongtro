import test from 'node:test';
import assert from 'node:assert/strict';
import { decideStartState, emptySnapshot, normalizeSnapshot } from './cloudSync.ts';

const snap = (name: string) => ({ ...emptySnapshot('a@b.vn'), properties: [{ ...emptySnapshot('a@b.vn').properties[0], name }] });

test('decideStartState: không có thay đổi chờ -> dùng bản trên mây', () => {
  const d = decideStartState({ local: { state: snap('cũ'), baseVersion: 'v1', dirty: false }, remote: { state: snap('mây'), updatedAt: 'v2' }, remoteFailed: false });
  assert.equal(d.use, 'remote');
  assert.equal(d.use === 'remote' && d.state.properties[0].name, 'mây');
  assert.equal(d.use === 'remote' && d.backupLocal, false);
});

test('decideStartState: thay đổi chờ trên máy, mây chưa đổi -> đẩy bản máy lên', () => {
  const d = decideStartState({ local: { state: snap('máy'), baseVersion: 'v1', dirty: true }, remote: { state: snap('mây'), updatedAt: 'v1' }, remoteFailed: false });
  assert.equal(d.use, 'local');
});

test('decideStartState: thay đổi chờ nhưng mây đã bị thiết bị khác sửa -> lấy mây, sao lưu bản máy', () => {
  const d = decideStartState({ local: { state: snap('máy'), baseVersion: 'v1', dirty: true }, remote: { state: snap('mây'), updatedAt: 'v9' }, remoteFailed: false });
  assert.equal(d.use, 'remote');
  assert.equal(d.use === 'remote' && d.backupLocal, true);
});

test('decideStartState: sổ mới tạo offline (chưa có trên mây) -> đẩy bản máy; chưa có gì -> sổ trống', () => {
  assert.equal(decideStartState({ local: { state: snap('máy'), baseVersion: null, dirty: true }, remote: null, remoteFailed: false }).use, 'local');
  assert.equal(decideStartState({ local: null, remote: null, remoteFailed: false }).use, 'empty');
});

test('decideStartState: mất mạng -> dùng bản sao trên máy nếu có', () => {
  assert.equal(decideStartState({ local: { state: snap('máy'), baseVersion: 'v1', dirty: true }, remote: null, remoteFailed: true }).use, 'offline-local');
  assert.equal(decideStartState({ local: null, remote: null, remoteFailed: true }).use, 'offline-none');
});

test('normalizeSnapshot: thiếu mảng thì điền rỗng, không có cơ sở thì từ chối', () => {
  assert.equal(normalizeSnapshot({ properties: [] }), null);
  assert.equal(normalizeSnapshot('rác'), null);
  const n = normalizeSnapshot({ properties: [{ id: 'p' }] });
  assert.deepEqual(n?.rooms, []);
  assert.deepEqual(n?.invoices, []);
});
