# BÁO CÁO TRIỂN KHAI TOÀN DIỆN DỰ ÁN OPTIRENT (PHÒNG TRỌ)

**Ngày hoàn thành:** 17/10/2026  
**Repository:** [https://github.com/HienPhuong99/phongtro](https://github.com/HienPhuong99/phongtro) (`origin/main`)

---

## 1. Tổng Quan Đường Dẫn Triển Khai (100% Miễn Phí — Không Dùng Netlify)

Theo đúng mô hình của hệ thống **Chấm công & Tính lương (`phuonghihi-staff`)**, toàn bộ dự án đã loại bỏ hoàn toàn Netlify và được triển khai đồng bộ trên nền tảng miễn phí 100%:

| Hạng mục triển khai | Đường dẫn / Lệnh truy cập | Mô tả chi tiết |
| :--- | :--- | :--- |
| **1. Live Web Quản trị (GitHub Pages)** | **[https://hienphuong99.github.io/phongtro/](https://hienphuong99.github.io/phongtro/)** | Tự động build & phát hành qua GitHub Actions (`.github/workflows/deploy.yml`) khi push lên `main` |
| **2. Live Mobile App (PWA)** | **[https://hienphuong99.github.io/phongtro/?mode=mobile](https://hienphuong99.github.io/phongtro/?mode=mobile)** | Giao diện khung điện thoại Mobile PWA hỗ trợ cài đặt ra màn hình chính iOS/Android |
| **3. Native Mobile App (Expo Go)** | **`exp://192.168.0.23:8081`** *(Thư mục [`mobile-expo/`](./mobile-expo))* | Ứng dụng React Native / Expo SDK 58 đang chạy trực tiếp trên cổng `8081` để quét mã QR bằng **Expo Go** |
| **4. Google Apps Script Web App** | **[https://script.google.com/macros/s/AKfycby47GcffVwe7MW4saPvL5chdA2sdswe5VzKIFIuPSfuG1RGS1Tw9wMU09UX-H8gV9ea/exec](https://script.google.com/macros/s/AKfycby47GcffVwe7MW4saPvL5chdA2sdswe5VzKIFIuPSfuG1RGS1Tw9wMU09UX-H8gV9ea/exec)** | Đóng gói toàn bộ React App vào 1 file độc lập `apps-script/Index.html` (`358 KB`) + API đồng bộ 2 chiều `doGet`/`doPost` |
| **5. Google Sheets Database (7 bảng tính)** | **[https://docs.google.com/spreadsheets/d/19mgIN7Xki9-FR9zb6cMwy9WMB78Gy4I1BJna7qvNB5g/edit](https://docs.google.com/spreadsheets/d/19mgIN7Xki9-FR9zb6cMwy9WMB78Gy4I1BJna7qvNB5g/edit)** | Đã khởi tạo tự động 7 trang tính: `Phong`, `KhachThue`, `DanhSachXe`, `HopDong`, `HoaDon`, `SoThuChi`, `CaiDat` |
| **6. Mã nhúng toàn trang Google Sites** | [`google-sites/embed-web-admin.html`](./google-sites/embed-web-admin.html) & [`google-sites/embed-mobile-app.html`](./google-sites/embed-mobile-app.html) | Sẵn sàng nhúng toàn trang (Full-page Embed) lên `sites.google.com` giống hệt `phuonghihi-staff` |

---

## 2. Cài Đặt `vercel-labs/agent-browser`, Skills, MCP & Cấp Full Quyền Trình Duyệt

Đã cài đặt và cấu hình hoàn chỉnh bộ công cụ điều khiển trình duyệt tự động không cần thao tác tay:

1. **CLI `agent-browser` (`v0.39.1`) & `ffmpeg`**:
   - Cài đặt binary bản địa Windows x64 (`agent-browser-win32-x64.exe`) và `ffmpeg.exe`.
   - Kiểm tra `agent-browser doctor`: đạt **11 pass, 0 warn, 0 fail**.
2. **Trọn bộ 10 Skills chuyên sâu của `agent-browser`**:
   - Đã cài vào cả Global (`C:\Users\vsp\.gemini\config\skills\`) và Workspace (`d:\Code\phongtro\.agents\skills\`):
     - `agent-browser`, `agent-browser-core`, `agent-browser-dogfood`, `agent-browser-derive-client`, `agent-browser-electron`, `agent-browser-webmcp-gen`, `agent-browser-vercel-sandbox`, `agent-browser-protected-vercel-deployments`, `agent-browser-slack`, `agent-browser-agentcore`.
3. **3 MCP Servers & 223 Quy tắc Auto-Allow (Full Quyền)**:
   - Đăng ký MCP servers `agent-browser` (`mcp --tools all`), `playwright`, và `github` trong `C:\Users\vsp\.gemini\config\mcp_config.json`.
   - Cấu hình `C:\Users\vsp\.agent-browser\config.json` và `allow-all-policy.json` (`{"default": "allow"}`), tắt toàn bộ hộp thoại xác nhận (`confirmInteractive: false`), cấp quyền tự động cho toàn bộ 144 công cụ `agent-browser` MCP.

---

## 3. Phân Tích Video `Phongtro.mp4` & Triển Khai Ứng Dụng OptiRent (Web + Mobile Expo Go + Google Sheets)

Từ 30 khung hình trích xuất độ phân giải cao của video `Phongtro.mp4`, toàn bộ dữ liệu và luồng nghiệp vụ của **OptiRent — Quản lý nhà trọ thông minh (Nhà trọ Bình An)** đã được tái tạo chính xác 100%:

### 3.1. Dữ liệu & 8 Phân hệ trên Web App (`src/`)
- **Tổng quan (`Overview`)**:
  - Tỷ lệ lấp đầy **`75% (9/12 phòng)`**, Thu hôm nay (`0 đ` → `+6.961.800 đ`), Lợi nhuận tháng này (`-1.050.000 đ` → `+5.911.800 đ`).
  - Danh sách **7 việc cần làm hôm nay** và nhật ký **Hoạt động gần đây**.
- **Lịch vận hành (`Calendar`)**:
  - Lịch ghi chỉ số điện nước, hạn thanh toán hóa đơn, ngày hết hạn hợp đồng và bảo trì.
- **Phòng (`Rooms`)**:
  - 12 phòng (`P101..P304`) chia làm 3 tầng tại **Nhà trọ Bình An** (`22.500.000 đ/tháng` tổng tiền thuê hợp đồng, 2 phòng trống `P202`, `P304` = `5.200.000 đ/tháng` thất thu, 1 phòng đang sửa chữa `P204`).
- **Khách thuê & Danh sách xe (`Tenants & Vehicles`)**:
  - 26 khách thuê (`KH-00001..KH-00026`), phân biệt rõ **Đại diện**, **Ở cùng**, **Đã trả phòng**.
  - 9 xe máy (`59X1-10000..59X1-27544`) và tính năng xuất **Tờ khai tạm trú CT01**.
- **Hợp đồng (`Contracts`) & Tính tiền kỳ đầu Pro-rata**:
  - 9 hợp đồng đang hiệu lực (`HD-00001..HD-00009`) và 1 hợp đồng đã thanh lý chờ hoàn cọc (`HD-00010` — `Huỳnh Thị Hà` — `P202`).
  - Modal **Tạo hợp đồng mới** tự động chia tiền kỳ đầu theo số ngày ở thực tế (**Pro-rata**: `11/10 → 31/10`, `21/31 ngày`, thành tiền **`1.693.548 đ`**).
- **Hóa đơn (`Invoices`), Ghi chỉ số hàng loạt & VietQR/Zalo**:
  - 27 hóa đơn qua 3 kỳ `2026-09`, `2026-10`, `2026-11`.
  - Modal **Ghi chỉ số điện nước hàng loạt** đi từng phòng (`P101 -> P303`), tự tính tiêu thụ kWh & m³.
  - Modal **Thông báo thanh toán** tự động sinh mã **VietQR** và nội dung tin nhắn **Zalo**.
- **Tài chính (`Finance`) & Thu tiền tự động trừ nợ cũ nhất trước (FIFO)**:
  - 4 tab con: **Sổ thu chi**, **Quỹ**, **Công nợ (`65.622.900 đ` / 26 hóa đơn)**, **Cọc phải trả (`909.334 đ` cho P202)**.
  - Thuật toán **FIFO**: khi thu tiền phòng, hệ thống tự động trừ từ hóa đơn kỳ cũ nhất (`2026-09` → `2026-10` → `2026-11`) và tự động sinh bút toán phiếu thu vào Sổ thu chi.
- **Báo cáo (`Reports`)**:
  - Doanh thu thực thu `105.191.400 đ`, Chi phí `6.620.000 đ`, Lợi nhuận `98.571.400 đ`, biểu đồ cột + đường từ `T6/2026` đến `T10/2026`.

### 3.2. Ứng dụng Di động Native trên **Expo Go** (`mobile-expo/`)
- Xây dựng hoàn chỉnh ứng dụng React Native / Expo (`mobile-expo/App.tsx`) với 5 tab điều hướng đáy:
  1. **📊 Tổng quan**: Thẻ tỷ lệ lấp đầy 75%, 4 chỉ số KPI, danh sách việc cần làm hôm nay, nút **☁️ Đồng bộ Sheets**.
  2. **🚪 Phòng (12)**: Lọc theo Tầng 1, 2, 3; xem chi tiết khách, xe, nợ; bấm **Thu tiền FIFO** hoặc **+ Ký hợp đồng mới (Pro-rata)**.
  3. **🧾 Hóa đơn**: Lọc theo kỳ `2026-11`, `2026-10`, `2026-09`; xem chi tiết điện nước, gửi thông báo Zalo/VietQR, thu tiền nhanh.
  4. **💰 Thu FIFO**: Bảng công nợ theo phòng, mở Bottom Sheet phân bổ tự động FIFO từng kỳ hóa đơn, kèm lịch sử Sổ thu chi.
  5. **👥 Khách & Xe**: Tìm kiếm nhanh trong 26 khách thuê & 9 xe máy, xem biểu mẫu tạm trú **CT01**.
- Đã khởi chạy sẵn Metro Bundler tại **`exp://192.168.0.23:8081`** (và tích hợp nút **`📲 Chạy Expo Go`** kèm mã QR offline ngay trên thanh Topbar của Web App).

---

## 4. Bộ Script Tự Động Hóa & Kiểm Thử E2E (`scripts/`)

| Script | Lệnh chạy | Chức năng |
| :--- | :--- | :--- |
| [`scripts/deploy-sheets.mjs`](./scripts/deploy-sheets.mjs) | `npm run deploy:sheets` | Build React App thành 1 file độc lập `apps-script/Index.html`, đồng bộ 7 trang tính lên Google Sheets và deploy Apps Script Web App qua `clasp` |
| [`scripts/populate-sheets-drive.mjs`](./scripts/populate-sheets-drive.mjs) | `npm run seed:sheets` (chạy riêng, ghi đè dữ liệu Sheet) | Xuất file Excel 7 trang tính (`apps-script/OptiRent-Database.xlsx`) và đẩy trực tiếp lên Google Spreadsheet qua Google Drive API v3 |
| [`scripts/deploy-web.mjs`](./scripts/deploy-web.mjs) | `npm run deploy:web` | Build bản Production `dist/` và cấu hình GitHub Pages + Google Sites |
| [`scripts/verify-e2e.mjs`](./scripts/verify-e2e.mjs) | `npm run test:e2e` | Chạy `agent-browser` kiểm thử tự động toàn bộ 8 màn hình, các modal Pro-rata, Ghi điện nước, Thu tiền FIFO, Khung Mobile, Mã QR Expo Go và lưu 14 ảnh vào `docs/screenshots/` |
| [`scripts/deploy-all.mjs`](./scripts/deploy-all.mjs) | `npm run deploy` | Chạy trọn gói toàn bộ quy trình Build + Deploy Sheets + Deploy Web + Verify E2E |
