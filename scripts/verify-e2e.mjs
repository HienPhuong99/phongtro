#!/usr/bin/env node
/**
 * Script kiểm thử E2E tự động bằng agent-browser
 * Kiểm tra toàn bộ 8 màn hình, giao diện Mobile, Mã QR Expo Go, các modal nghiệp vụ và luồng thu tiền FIFO
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT_DIR, 'docs', 'screenshots');
const SESSION = 'optirent-e2e';

function ab(args) {
  const cmd = `agent-browser --session ${SESSION} ${args}`;
  console.log(`[agent-browser] $ ${cmd}`);
  execSync(cmd, { cwd: ROOT_DIR, stdio: 'inherit' });
}

function clickBtn(label) {
  const js = `(() => { const btns = Array.from(document.querySelectorAll('button')); const target = btns.reverse().find(b => b.innerText && b.innerText.includes('${label}')); if (target) { target.click(); return true; } return false; })()`;
  ab(`eval "${js}"`);
}

function closeTopModal() {
  const js = `(() => { const btns = Array.from(document.querySelectorAll('button')); const cancel = btns.reverse().find(b => b.innerText && (b.innerText.includes('Huỷ') || b.innerText.includes('Hủy') || b.innerText.includes('Đóng') || b.innerText.includes('Hoàn tất') || b.innerText.includes('Lưu & Lập hóa đơn'))); if (cancel) { cancel.click(); return true; } const modalX = document.querySelector('.fixed.inset-0 button'); if (modalX) { modalX.click(); return true; } return false; })()`;
  ab(`eval "${js}"`);
}

async function main() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const singleFileHtmlPath = path.join(ROOT_DIR, 'apps-script', 'Index.html').replace(/\\/g, '/');
  const targetUrl = process.env.VERIFY_URL || `file:///${singleFileHtmlPath}`;

  console.log(`=== BẮT ĐẦU KIỂM THỬ E2E VỚI AGENT-BROWSER TẠI: ${targetUrl} ===`);

  // 1. Mở trang Tổng quan
  ab(`open "${targetUrl}"`);
  ab(`set viewport 1440 900`);
  ab(`wait 600`);
  ab(`get title`);
  ab(`screenshot "${path.join(SCREENSHOTS_DIR, '01-dashboard.png')}"`);

  // 2. Chuyển sang màn hình Phòng
  clickBtn('Phòng');
  ab(`wait 400`);
  ab(`screenshot "${path.join(SCREENSHOTS_DIR, '02-rooms.png')}"`);

  // 3. Chuyển sang màn hình Khách thuê & Danh sách xe
  clickBtn('Khách thuê');
  ab(`wait 400`);
  ab(`screenshot "${path.join(SCREENSHOTS_DIR, '03-tenants.png')}"`);
  clickBtn('Danh sách xe');
  ab(`wait 400`);
  ab(`screenshot "${path.join(SCREENSHOTS_DIR, '04-vehicles.png')}"`);

  // 4. Chuyển sang màn hình Hợp đồng & mở modal Tạo hợp đồng mới (Pro-rata)
  clickBtn('Hợp đồng');
  ab(`wait 400`);
  ab(`screenshot "${path.join(SCREENSHOTS_DIR, '05-contracts.png')}"`);
  clickBtn('Tạo hợp đồng mới');
  ab(`wait 400`);
  ab(`screenshot "${path.join(SCREENSHOTS_DIR, '06-modal-prorata-contract.png')}"`);
  closeTopModal();
  ab(`wait 300`);

  // 5. Chuyển sang màn hình Hóa đơn & mở modal Ghi chỉ số hàng loạt
  clickBtn('Hóa đơn');
  ab(`wait 400`);
  ab(`screenshot "${path.join(SCREENSHOTS_DIR, '07-invoices.png')}"`);
  clickBtn('Ghi chỉ số hàng loạt');
  ab(`wait 400`);
  ab(`screenshot "${path.join(SCREENSHOTS_DIR, '08-modal-bulk-meter.png')}"`);
  closeTopModal();
  ab(`wait 300`);

  // 6. Chuyển sang màn hình Tài chính -> Công nợ -> Thu tiền FIFO cho Phòng P101
  clickBtn('Công nợ');
  ab(`wait 400`);
  ab(`screenshot "${path.join(SCREENSHOTS_DIR, '09-finance-debt-before.png')}"`);

  clickBtn('Thu nợ');
  ab(`wait 400`);
  ab(`screenshot "${path.join(SCREENSHOTS_DIR, '10-modal-fifo-payment.png')}"`);
  clickBtn('Xác nhận thu');
  ab(`wait 400`);
  closeTopModal();
  ab(`wait 400`);
  ab(`screenshot "${path.join(SCREENSHOTS_DIR, '11-finance-debt-after-fifo.png')}"`);

  // 7. Chuyển sang màn hình Báo cáo
  clickBtn('Báo cáo');
  ab(`wait 400`);
  ab(`screenshot "${path.join(SCREENSHOTS_DIR, '12-reports.png')}"`);

  // 8. Kiểm tra chế độ Mobile & Modal Mã QR Expo Go
  clickBtn('Khung Mobile');
  ab(`wait 400`);
  ab(`screenshot "${path.join(SCREENSHOTS_DIR, '13-mobile-preview.png')}"`);
  clickBtn('Chạy Expo Go');
  ab(`wait 500`);
  ab(`screenshot "${path.join(SCREENSHOTS_DIR, '14-expo-go-qr-modal.png')}"`);

  ab(`close`);
  console.log('=== HOÀN TẤT KIỂM THỬ E2E VỚI AGENT-BROWSER (14 ẢNH CHỤP MÀN HÌNH) ===');
}

main().catch((err) => {
  console.error('Lỗi khi chạy kiểm thử E2E:', err.message || err);
  try {
    ab('close');
  } catch {}
  process.exit(1);
});
