#!/usr/bin/env node
/**
 * Script tự động đóng gói Single-File HTML vào apps-script/Index.html
 * và triển khai lên Google Sheets + Google Apps Script Web App qua clasp
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const APPS_SCRIPT_DIR = path.join(ROOT_DIR, 'apps-script');
const CLASP_JSON_PATH = path.join(APPS_SCRIPT_DIR, '.clasp.json');
const DEPLOY_INFO_PATH = path.join(APPS_SCRIPT_DIR, 'deployment-info.json');
const MANIFEST_PATH = path.join(APPS_SCRIPT_DIR, 'appsscript.json');
const INDEX_HTML_PATH = path.join(APPS_SCRIPT_DIR, 'Index.html');
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

function bundleDistIntoAppsScriptHtml() {
  console.log('[0/4] Build React bundle & đóng gói thành 1 file độc lập apps-script/Index.html...');
  run('npm run build', ROOT_DIR);

  const assetsDir = path.join(DIST_DIR, 'assets');
  const files = fs.readdirSync(assetsDir);
  const cssFile = files.find((f) => f.endsWith('.css'));
  const jsFile = files.find((f) => f.endsWith('.js'));

  const cssContent = cssFile ? fs.readFileSync(path.join(assetsDir, cssFile), 'utf8') : '';
  let jsContent = jsFile ? fs.readFileSync(path.join(assetsDir, jsFile), 'utf8') : '';
  // Tránh chuỗi </script> bên trong JS làm đóng thẻ script sớm
  jsContent = jsContent.replace(/<\/script>/gi, '<\\/script>');

  const singleFileHtml = `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Quản lý phòng trọ</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet" />
    <style>${cssContent}</style>
  </head>
  <body class="bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
    <div id="root"></div>
    <script type="module">${jsContent}</script>
  </body>
</html>
`;

  fs.writeFileSync(INDEX_HTML_PATH, singleFileHtml, 'utf8');
  console.log(`Đã đóng gói apps-script/Index.html (${(singleFileHtml.length / 1024).toFixed(1)} KB) chạy độc lập 100% trên Google Apps Script!`);
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
