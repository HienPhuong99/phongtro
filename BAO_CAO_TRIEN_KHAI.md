# BÁO CÁO TRIỂN KHAI HỆ THỐNG QUẢN LÝ PHÒNG TRỌ

**Ngày cập nhật:** 17/10/2026  
**Repository:** [https://github.com/HienPhuong99/phongtro](https://github.com/HienPhuong99/phongtro) (`origin/main`)

---

## 1. Tổng Quan Đường Dẫn Triển Khai (100% Miễn Phí — Không Dùng Netlify)

Toàn bộ dự án **Quản lý phòng trọ** được triển khai đồng bộ trên nền tảng miễn phí 100%:

| Hạng mục triển khai | Đường dẫn / Lệnh truy cập | Mô tả chi tiết |
| :--- | :--- | :--- |
| **1. Live Web Quản trị (GitHub Pages)** | **[https://hienphuong99.github.io/phongtro/](https://hienphuong99.github.io/phongtro/)** | Tự động build & phát hành qua GitHub Actions (`.github/workflows/deploy.yml`) khi push lên `main` |
| **2. Live Mobile App (PWA)** | **[https://hienphuong99.github.io/phongtro/?mode=mobile](https://hienphuong99.github.io/phongtro/?mode=mobile)** | Giao diện khung điện thoại Mobile PWA hỗ trợ cài đặt ra màn hình chính iOS/Android |
| **3. Native Mobile App (Expo Go)** | **`exp://192.168.0.23:8081`** *(Thư mục [`mobile-expo/`](./mobile-expo))* | Ứng dụng React Native / Expo SDK 58 chạy trực tiếp trên cổng `8081` để quét mã QR bằng **Expo Go** |
| **4. Google Apps Script Web App** | **[https://script.google.com/macros/s/AKfycby47GcffVwe7MW4saPvL5chdA2sdswe5VzKIFIuPSfuG1RGS1Tw9wMU09UX-H8gV9ea/exec](https://script.google.com/macros/s/AKfycby47GcffVwe7MW4saPvL5chdA2sdswe5VzKIFIuPSfuG1RGS1Tw9wMU09UX-H8gV9ea/exec)** | Đóng gói toàn bộ React App vào 1 file độc lập `apps-script/Index.html` + API đồng bộ 2 chiều `doGet`/`doPost` |
| **5. Google Sheets Database (7 bảng tính)** | **[https://docs.google.com/spreadsheets/d/19mgIN7Xki9-FR9zb6cMwy9WMB78Gy4I1BJna7qvNB5g/edit](https://docs.google.com/spreadsheets/d/19mgIN7Xki9-FR9zb6cMwy9WMB78Gy4I1BJna7qvNB5g/edit)** | Khởi tạo tự động 7 trang tính: `Phong`, `KhachThue`, `DanhSachXe`, `HopDong`, `HoaDon`, `SoThuChi`, `CaiDat` |
| **6. Mã nhúng toàn trang Google Sites** | [`google-sites/embed-web-admin.html`](./google-sites/embed-web-admin.html) & [`google-sites/embed-mobile-app.html`](./google-sites/embed-mobile-app.html) | Sẵn sàng nhúng toàn trang (Full-page Embed) lên `sites.google.com` |

---

## 2. Nhận Diện Thương Hiệu & Thiết Kế Giao Diện (`DESIGN.md`)

- **Tên ứng dụng**: **Quản lý phòng trọ**
- **Logo mới (`public/logo.svg` & `BrandLogoIcon`)**: Biểu tượng mái nhà trọ kết hợp 4 ô cửa sổ phòng trên nền xanh `#2563EB → #1D4ED8` kèm huy hiệu trạng thái xanh ngọc `#10B981`.
- **Chuẩn giao diện `ui-skills.com`**:
  - Áp dụng `tabular-nums` cho toàn bộ số tiền VND, chỉ số điện nước, phần trăm và số liệu thống kê.
  - Hỗ trợ điều hướng bàn phím (`Escape` đóng modal, hoàn trả focus), `aria-label` đầy đủ cho các nút thao tác, và chuyển động mượt trên compositor (`transform`, `opacity`).

---

## 3. Các Phân Hệ Nghiệp Vụ Trên Web App (`src/`) & Mobile (`mobile-expo/`)

- **Tổng quan (`Overview`)**:
  - Theo dõi tỷ lệ lấp đầy, Thu hôm nay, Lợi nhuận tháng này, Công nợ cần thu, Cọc phải trả và danh sách Việc cần làm hôm nay theo từng cơ sở.
- **Lịch vận hành (`Calendar`)**:
  - Lịch ghi chỉ số điện nước, hạn thanh toán hóa đơn, ngày hết hạn hợp đồng và bảo trì.
- **Phòng (`Rooms`) & Điều chỉnh giá thuê**:
  - Sơ đồ phòng chia theo tầng và bảng danh sách tất cả phòng.
  - Tính năng **Điều chỉnh giá thuê phòng** cho từng phòng hoặc bảng giá hàng loạt 12 phòng, tự động đồng bộ sang Hợp đồng và Hóa đơn chưa thu.
- **Khách thuê & Danh sách xe (`Tenants & Vehicles`)**:
  - Quản lý khách đại diện, người ở cùng, danh sách xe máy và xuất **Tờ khai tạm trú CT01**.
- **Hợp đồng (`Contracts`) & Tính tiền kỳ đầu Pro-rata**:
  - Kiểm tra hợp lệ SĐT, CCCD, ngày bắt đầu/kết thúc, tính đúng số ngày còn lại của hợp đồng, tự động chia tiền phòng kỳ đầu theo số ngày thực tế (**Pro-rata**) và tự động sinh hóa đơn kỳ đầu tiên.
- **Hóa đơn (`Invoices`), Ghi chỉ số hàng loạt & VietQR/Zalo**:
  - Kiểm tra chỉ số điện/nước mới không nhỏ hơn chỉ số cũ, hiển thị trạng thái **Đã thu đủ** bằng màu xanh lá (`text-emerald-600`) và **Còn nợ** bằng màu đỏ (`text-rose-600`).
  - Tạo phiếu thông báo thanh toán kèm mã **VietQR** và nội dung tin nhắn **Zalo**.
- **Tài chính (`Finance`) & Thu tiền tự động trừ nợ cũ nhất trước (FIFO)**:
  - 4 tab con: **Sổ thu chi**, **Quỹ**, **Công nợ**, **Cọc phải trả**.
  - Thuật toán **FIFO** tự động phân bổ số tiền khách trả vào các hóa đơn cũ nhất trước và ghi bút toán vào Sổ thu chi.
- **Báo cáo (`Reports`)**:
  - Thống kê Doanh thu thực thu, Chi phí, Lợi nhuận ròng, biểu đồ kết hợp cột + đường và xuất báo cáo CSV.

---

## 4. Bộ Script Tự Động Hóa & Kiểm Thử E2E (`scripts/`)

| Script | Lệnh chạy | Chức năng |
| :--- | :--- | :--- |
| [`scripts/deploy-sheets.mjs`](./scripts/deploy-sheets.mjs) | `npm run deploy:sheets` | Build React App thành 1 file độc lập `apps-script/Index.html` và deploy Apps Script Web App qua `clasp` (giữ nguyên dữ liệu trên Google Sheets) |
| [`scripts/populate-sheets-drive.mjs`](./scripts/populate-sheets-drive.mjs) | `npm run seed:sheets` (chạy riêng khi cần nạp lại dữ liệu mẫu) | Xuất file Excel 7 trang tính (`apps-script/QuanLyPhongTro-Database.xlsx`) và đẩy lên Google Spreadsheet qua Google Drive API v3 |
| [`scripts/deploy-web.mjs`](./scripts/deploy-web.mjs) | `npm run deploy:web` | Build bản Production `dist/` và cấu hình GitHub Pages + Google Sites |
| [`scripts/verify-e2e.mjs`](./scripts/verify-e2e.mjs) | `npm run test:e2e` | Chạy `agent-browser` kiểm thử tự động toàn bộ 8 màn hình, kiểm chứng 7 bản vá lỗi, điều chỉnh giá phòng, Thu tiền FIFO, Khung Mobile, Mã QR Expo Go và lưu 17 ảnh vào `docs/screenshots/` |
| [`scripts/deploy-all.mjs`](./scripts/deploy-all.mjs) | `npm run deploy` | Chạy trọn gói toàn bộ quy trình Build + Deploy Sheets + Deploy Web + Verify E2E |
