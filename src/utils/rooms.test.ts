import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRoom, suggestNextRoomCode } from './rooms.ts';
import type { Property, Room } from '../types.ts';

const prop = { id: 'p1', name: 'Nhà A', trashFee: 30000, internetFee: 100000 } as Property;
const base = { code: ' p101 ', floor: 1, price: 3000000, deposit: 3000000, elecIndex: 120, waterIndex: 8 };

test('buildRoom: phòng trống mới, mã viết hoa, phí lấy theo khu', () => {
  const r = buildRoom(base, prop, []);
  assert.ok('room' in r);
  assert.equal(r.room.code, 'P101');
  assert.equal(r.room.status, 'vacant');
  assert.equal(r.room.trashFee, 30000);
  assert.equal(r.room.elecIndex, 120);
});

test('buildRoom: chặn mã trống, trùng trong cùng khu, số âm; khu khác thì được trùng mã', () => {
  const existing = [{ propertyId: 'p1', code: 'P101' }, { propertyId: 'p2', code: 'P102' }] as Room[];
  assert.ok('error' in buildRoom({ ...base, code: '  ' }, prop, existing));
  assert.ok('error' in buildRoom(base, prop, existing));
  assert.ok('error' in buildRoom({ ...base, code: 'P103', price: -1 }, prop, existing));
  assert.ok('room' in buildRoom({ ...base, code: 'P102' }, prop, existing));
});

test('suggestNextRoomCode', () => {
  assert.equal(suggestNextRoomCode([]), 'P101');
  assert.equal(suggestNextRoomCode([{ code: 'P101' }, { code: 'P205' }, { code: 'Kiot' }] as Room[]), 'P206');
});
