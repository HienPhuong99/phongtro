#!/usr/bin/env node
/**
 * Script tự động build và cấu hình triển khai miễn phí 100% qua:
 * 1. GitHub Pages: https://hienphuong99.github.io/phongtro/
 * 2. Google Sites (nhúng toàn trang): https://sites.google.com/view/phuonghihi-phongtro
 * 3. Google Apps Script Web App: https://script.google.com/macros/s/AKfycby47GcffVwe7MW4saPvL5chdA2sdswe5VzKIFIuPSfuG1RGS1Tw9wMU09UX-H8gV9ea/exec
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const WEB_DEPLOY_INFO_PATH = path.join(ROOT_DIR, 'scripts', 'web-deployment-info.json');

function run(cmd, cwd = ROOT_DIR) {
  console.log(`[deploy-web] $ ${cmd}`);
  return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

async function main() {
  console.log('=== BẮT ĐẦU BUILD & CẤU HÌNH GITHUB PAGES + GOOGLE SITES (MIỄN PHÍ 100%) ===');

  console.log('[1/2] Build ứng dụng Production (npm run build)...');
  run('npm run build');

  console.log('[2/2] Kiểm tra / Kích hoạt GitHub Pages (build_type: workflow) cho HienPhuong99/phongtro...');
  try {
    run('gh api repos/HienPhuong99/phongtro/pages -X POST -f build_type=workflow');
    console.log('Đã bật GitHub Pages thành công.');
  } catch {
    try {
      run('gh api repos/HienPhuong99/phongtro/pages -X PUT -f build_type=workflow');
      console.log('GitHub Pages đã được cấu hình sẵn ở chế độ GitHub Actions workflow.');
    } catch (e) {
      console.log('GitHub Pages sẽ tự động kích hoạt ngay khi push nhánh main.');
    }
  }

  const info = {
    provider: 'GitHub Pages + Google Sites + Google Apps Script (100% Free)',
    githubPagesUrl: 'https://hienphuong99.github.io/phongtro/',
    googleSitesUrl: 'https://sites.google.com/view/phuonghihi-phongtro',
    appsScriptWebAppUrl:
      'https://script.google.com/macros/s/AKfycby47GcffVwe7MW4saPvL5chdA2sdswe5VzKIFIuPSfuG1RGS1Tw9wMU09UX-H8gV9ea/exec',
    googleSheetsUrl:
      'https://docs.google.com/spreadsheets/d/19mgIN7Xki9-FR9zb6cMwy9WMB78Gy4I1BJna7qvNB5g/edit',
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(WEB_DEPLOY_INFO_PATH, JSON.stringify(info, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify(info, null, 2));
  console.log('=== HOÀN TẤT BUILD & CẤU HÌNH GITHUB PAGES + GOOGLE SITES ===');
}

main().catch((err) => {
  console.error('Lỗi khi cấu hình deploy web:', err.message || err);
  process.exit(1);
});
