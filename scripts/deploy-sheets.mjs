#!/usr/bin/env node
/**
 * Script tự động đóng gói Single-File HTML vào apps-script/Index.html
 * và triển khai lên Google Sheets + Google Apps Script Web App qua clasp
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundleDistIntoAppsScriptHtml } from './build-singlefile.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const APPS_SCRIPT_DIR = path.join(ROOT_DIR, 'apps-script');
const CLASP_JSON_PATH = path.join(APPS_SCRIPT_DIR, '.clasp.json');
const DEPLOY_INFO_PATH = path.join(APPS_SCRIPT_DIR, 'deployment-info.json');
const MANIFEST_PATH = path.join(APPS_SCRIPT_DIR, 'appsscript.json');
const APP_TSX_PATH = path.join(ROOT_DIR, 'src', 'App.tsx');

const MANIFEST_CONTENT = {
  timeZone: 'Asia/Ho_Chi_Minh',
  dependencies: {},
  exceptionLogging: 'STACKDRIVER',
  runtimeVersion: 'V8',
  webapp: {
    executeAs: 'USER_DEPLOYING',
    access: 'ANYONE_ANONYMOUS',
  },
};

function run(cmd, cwd = APPS_SCRIPT_DIR) {
  console.log(`[deploy-sheets] $ ${cmd}`);
  return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

async function main() {
  console.log('=== BẮT ĐẦU TRIỂN KHAI GOOGLE SHEETS + APPS SCRIPT ===');

  bundleDistIntoAppsScriptHtml();

  if (!fs.existsSync(CLASP_JSON_PATH)) {
    console.log('[1/4] Chưa có .clasp.json -> Tạo mới Google Spreadsheet + Apps Script...');
    const createOut = run('clasp create --type sheets --title "Quản lý phòng trọ"');
    console.log(createOut.trim());
  } else {
    console.log('[1/4] Đã tìm thấy .clasp.json hiện hữu.');
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(MANIFEST_CONTENT, null, 2) + '\n', 'utf8');

  const claspConfig = JSON.parse(fs.readFileSync(CLASP_JSON_PATH, 'utf8'));
  const scriptId = claspConfig.scriptId;
  const parentId = Array.isArray(claspConfig.parentId) ? claspConfig.parentId[0] : claspConfig.parentId;
  const spreadsheetUrl = parentId ? `https://docs.google.com/spreadsheets/d/${parentId}/edit` : '';
  const scriptEditorUrl = `https://script.google.com/d/${scriptId}/edit`;

  // Không nạp dữ liệu mẫu ở đây: populate-sheets-drive ghi đè toàn bộ Sheet (mất dữ liệu thật).
  // Muốn nạp lại dữ liệu mẫu thì chạy riêng `npm run seed:sheets`.
  console.log('[2/4] Đẩy mã nguồn Apps Script (giữ nguyên dữ liệu trên Google Sheets)...');
  const pushOut = run('clasp push --force');
  console.log(pushOut.trim());

  let existingDeploymentId = '';
  if (fs.existsSync(DEPLOY_INFO_PATH)) {
    try {
      existingDeploymentId = JSON.parse(fs.readFileSync(DEPLOY_INFO_PATH, 'utf8')).deploymentId || '';
    } catch {}
  }

  console.log('[3/4] Phát hành phiên bản Web App (clasp deploy)...');
  let deployOut = '';
  if (existingDeploymentId) {
    try {
      deployOut = run(`clasp deploy -i ${existingDeploymentId} -d "Quản lý phòng trọ Web App & Sheets Sync API"`);
    } catch {
      deployOut = run('clasp deploy -d "Quản lý phòng trọ Web App & Sheets Sync API"');
    }
  } else {
    deployOut = run('clasp deploy -d "Quản lý phòng trọ Web App & Sheets Sync API"');
  }
  console.log(deployOut.trim());

  let deploymentId = existingDeploymentId;
  const match = deployOut.match(/-\s+([A-Za-z0-9_-]+)\s+@\d+/);
  if (match) {
    deploymentId = match[1];
  } else if (!deploymentId) {
    const listOut = run('clasp deployments');
    const lines = listOut.split('\n').map((l) => l.trim());
    for (const line of lines) {
      const m = line.match(/^-\s+([A-Za-z0-9_-]+)\s+@(\d+)/);
      if (m) {
        deploymentId = m[1];
      }
    }
  }

  const webAppUrl = deploymentId
    ? `https://script.google.com/macros/s/${deploymentId}/exec`
    : '';

  const info = {
    projectTitle: 'Quản lý phòng trọ',
    scriptId,
    parentId,
    spreadsheetUrl,
    scriptEditorUrl,
    deploymentId,
    webAppUrl,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(DEPLOY_INFO_PATH, JSON.stringify(info, null, 2) + '\n', 'utf8');
  console.log('[4/4] Đã lưu thông tin triển khai vào apps-script/deployment-info.json:');
  console.log(JSON.stringify(info, null, 2));

  if (webAppUrl && fs.existsSync(APP_TSX_PATH)) {
    let appTsx = fs.readFileSync(APP_TSX_PATH, 'utf8');
    appTsx = appTsx.replace(
      /export const DEFAULT_APPS_SCRIPT_URL =\s*'[^']*';/,
      `export const DEFAULT_APPS_SCRIPT_URL =\n  '${webAppUrl}';`
    );
    if (spreadsheetUrl) {
      appTsx = appTsx.replace(
        /export const DEFAULT_GOOGLE_SHEETS_URL =\s*'[^']*';/,
        `export const DEFAULT_GOOGLE_SHEETS_URL =\n  '${spreadsheetUrl}';`
      );
    }
    fs.writeFileSync(APP_TSX_PATH, appTsx, 'utf8');
  }

  console.log('=== HOÀN TẤT TRIỂN KHAI GOOGLE SHEETS + APPS SCRIPT ===');
}

main().catch((err) => {
  console.error('Lỗi khi triển khai Google Sheets + Apps Script:', err.message || err);
  process.exit(1);
});
