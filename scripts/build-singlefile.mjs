#!/usr/bin/env node
/**
 * Script đóng gói bản build Vite (dist/) thành 1 file độc lập apps-script/Index.html
 * Dùng chung cho cả kiểm thử E2E (verify-e2e.mjs) và triển khai Apps Script (deploy-sheets.mjs).
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'apps-script', 'Index.html');

export function bundleDistIntoAppsScriptHtml() {
  console.log('[build-singlefile] Build React bundle & đóng gói thành 1 file độc lập apps-script/Index.html...');
  execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });

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
  console.log(
    `[build-singlefile] Đã đóng gói apps-script/Index.html (${(singleFileHtml.length / 1024).toFixed(1)} KB)!`
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  bundleDistIntoAppsScriptHtml();
}
