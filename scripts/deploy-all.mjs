#!/usr/bin/env node
/**
 * Script triển khai toàn diện (One-Click Deploy):
 * 1. Đẩy code Google Sheets + Apps Script Web App
 * 2. Build & Cấu hình Web App lên GitHub Pages + Google Sites
 * 3. Chạy kiểm thử E2E bằng agent-browser
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function runStep(label, cmd) {
  console.log(`\n========================================`);
  console.log(`🚀 ${label}`);
  console.log(`========================================`);
  execSync(cmd, { cwd: ROOT_DIR, stdio: 'inherit' });
}

async function main() {
  runStep('BƯỚC 1/3: Triển khai Google Sheets & Apps Script Backend', 'node scripts/deploy-sheets.mjs');
  runStep('BƯỚC 2/3: Build & Cấu hình Web App trên GitHub Pages + Google Sites', 'node scripts/deploy-web.mjs');
  runStep('BƯỚC 3/3: Kiểm thử E2E tự động bằng agent-browser', 'node scripts/verify-e2e.mjs');
  console.log('\n✅ HOÀN TẤT TOÀN BỘ QUY TRÌNH BUILD, DEPLOY & VERIFY E2E!');
}

main().catch((err) => {
  console.error('\n❌ Lỗi trong quá trình triển khai:', err.message || err);
  process.exit(1);
});
