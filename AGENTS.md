# phongtro

Repo: https://github.com/HienPhuong99/phongtro (remote `origin`, nhánh chính `main`)

## Quy tắc làm việc

Mỗi khi xong 1 task, tự động làm (không cần hỏi lại):

1. **Commit** — làm trên nhánh `task/<tên-ngắn>`, commit theo Conventional Commits.
2. **Merge** — `git checkout main && git merge --no-ff task/<tên-ngắn>`, rồi `git push origin main` và xoá nhánh task.
3. **Triển khai** — chạy lệnh deploy của dự án (ghi vào mục bên dưới khi đã có). Chưa có thì bỏ qua và báo lại.

Nếu build/test lỗi thì dừng lại, không merge/deploy, báo lỗi.

Kế hoạch kinh doanh và lộ trình tính năng: [docs/KE-HOACH-KINH-DOANH.md](docs/KE-HOACH-KINH-DOANH.md).

## Deploy

- **Lệnh triển khai toàn diện (Google Sheets 7 trang tính + Apps Script Web App + GitHub Pages + Kiểm thử E2E `agent-browser`)**:
  ```bash
  npm run deploy
  ```
- **Các lệnh thành phần**:
  - `npm run deploy:sheets` — Build single-file `apps-script/Index.html`, đẩy mã Apps Script và phát hành Web App qua `clasp`. **Không** đụng tới dữ liệu trên Google Sheets.
    - API dữ liệu cần mã `SYNC_TOKEN` (tạo bằng menu 🔑 trên Google Sheets, lưu trong Script Properties, không ghi vào repo). Trong `Code.gs`, mọi hàm nội bộ phải kết thúc bằng `_` (trang `/exec` cho phép gọi mọi hàm công khai qua `google.script.run`); hàm của menu phải gọi `assertSheetUi_()` trước tiên.
  - `npm run seed:sheets` — ⚠️ Ghi đè toàn bộ 7 bảng trên Google Sheets (`19mgIN7Xki9-FR9zb6cMwy9WMB78Gy4I1BJna7qvNB5g`) bằng dữ liệu mẫu, mất dữ liệu thật. Chỉ chạy khi người dùng yêu cầu rõ ràng, không chạy trong quy trình deploy tự động.
  - `npm run deploy:web` — Build production bundle `dist/` và kích hoạt GitHub Pages workflow (`.github/workflows/deploy.yml`).
  - `npm run test:e2e` — Chạy kiểm thử tự động E2E toàn bộ 8 màn hình + Mobile + Expo Go QR bằng `agent-browser` và xuất 17 ảnh chụp màn hình vào `docs/screenshots/`.
  - `cd mobile-expo && npx expo start --port 8081` — Khởi chạy máy chủ **Expo Go** (`exp://192.168.0.23:8081`) cho ứng dụng di động React Native.

### Đường dẫn triển khai thực tế (100% Miễn phí — Không dùng Netlify)
- **🌐 Live Web App (GitHub Pages)**: https://hienphuong99.github.io/phongtro/
- **📱 Live Mobile PWA (`?mode=mobile`)**: https://hienphuong99.github.io/phongtro/?mode=mobile
- **📲 Native Mobile App (Expo Go)**: `exp://192.168.0.23:8081` (thư mục `mobile-expo/`)
- **🏛️ Google Sites Embed (`google-sites/`)**: `https://sites.google.com/view/phuonghihi-phongtro` (nhúng toàn trang từ `google-sites/embed-web-admin.html` & `google-sites/embed-mobile-app.html`)
- **⚡ Google Apps Script Web App (Single-File HTML)**: https://script.google.com/macros/s/AKfycby47GcffVwe7MW4saPvL5chdA2sdswe5VzKIFIuPSfuG1RGS1Tw9wMU09UX-H8gV9ea/exec
- **📊 Google Sheets Database (7 bảng tính)**: https://docs.google.com/spreadsheets/d/19mgIN7Xki9-FR9zb6cMwy9WMB78Gy4I1BJna7qvNB5g/edit
