export function formatVND(amount: number, showSign = false): string {
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (amount < 0) return `-${formatted} đ`;
  if (showSign && amount > 0) return `+${formatted} đ`;
  return `${formatted} đ`;
}

export function formatNumberInput(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function readMoneyWordsVN(amount: number): string {
  if (amount <= 0) return 'Không đồng';
  const units = ['', 'nghìn', 'triệu', 'tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readTriple(n: number, full: boolean): string {
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    const parts: string[] = [];

    if (h > 0 || full) {
      parts.push(`${digits[h]} trăm`);
    }
    if (t > 1) {
      parts.push(`${digits[t]} mươi`);
      if (u === 1) parts.push('mốt');
      else if (u === 5) parts.push('lăm');
      else if (u > 0) parts.push(digits[u]);
    } else if (t === 1) {
      parts.push('mười');
      if (u === 5) parts.push('lăm');
      else if (u > 0) parts.push(digits[u]);
    } else if (t === 0 && u > 0) {
      if (h > 0 || full) parts.push('lẻ');
      parts.push(digits[u]);
    }
    return parts.join(' ');
  }

  let remaining = Math.round(amount);
  const groups: number[] = [];
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g > 0) {
      const tripleText = readTriple(g, i < groups.length - 1);
      words.push(`${tripleText}${units[i] ? ' ' + units[i] : ''}`);
    }
  }

  const raw = words.join(' ').trim() + ' đồng';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function getVietQrUrl(params: {
  bankBin: string;
  bankAccount: string;
  bankOwner: string;
  amount: number;
  addInfo: string;
}): string {
  const { bankBin, bankAccount, bankOwner, amount, addInfo } = params;
  const info = encodeURIComponent(addInfo);
  const name = encodeURIComponent(bankOwner);
  return `https://img.vietqr.io/image/${bankBin}-${bankAccount}-compact2.png?amount=${Math.round(amount)}&addInfo=${info}&accountName=${name}`;
}

export function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

// Ngày "hôm nay" của bộ dữ liệu demo (toàn bộ dữ liệu mẫu xoay quanh kỳ 10/2026)
export const APP_TODAY = '11/10/2026';

/** Đổi 'DD/MM/YYYY' thành Date (giờ địa phương); trả về null nếu sai định dạng hoặc ngày không tồn tại. */
export function parseDateVN(value: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

/** Số ngày từ `from` tới `to` (DD/MM/YYYY); âm nếu `to` đã qua. Sai định dạng trả về 0. */
export function daysBetweenVN(from: string, to: string): number {
  const a = parseDateVN(from);
  const b = parseDateVN(to);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** 'DD/MM/YYYY' -> 'YYYY-MM-DD' (giá trị của <input type="date">). */
export function vnToIsoDate(value: string): string {
  const d = parseDateVN(value);
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 'YYYY-MM-DD' -> 'DD/MM/YYYY'. */
export function isoToVnDate(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/** Date -> 'DD/MM/YYYY'. */
export function formatDateVN(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
