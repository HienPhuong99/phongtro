# OptiRent — Hệ Thống Quản Lý Nhà Trọ, Hợp Đồng, Điện Nước, VietQR & Thu Tiền FIFO (Web + Mobile PWA + Expo Go + Google Sites + Google Sheets)

Hệ thống Quản lý Nhà trọ thông minh **OptiRent** được xây dựng khớp 100% với video mẫu [`Phongtro.mp4`](./Phongtro.mp4) cho cơ sở **Nhà trọ Bình An** (`12 phòng · 3 tầng · 26 khách thuê · 9 xe máy · 10 hợp đồng · 27 hóa đơn`), tích hợp đồng bộ 2 chiều với **Google Sheets (7 trang tính)**, **Google Apps Script Web App**, **GitHub Pages**, **Google Sites** và ứng dụng di động **Expo Go (`mobile-expo/`)** hoàn toàn miễn phí 100%.

- **🏢 Cơ sở vận hành mẫu**: **Nhà trọ Bình An** (`128 Nguyễn Văn Thương, Bình Thạnh, TP. Hồ Chí Minh`)
- **🚀 Live Web Quản trị (GitHub Pages)**: [https://hienphuong99.github.io/phongtro/](https://hienphuong99.github.io/phongtro/)
- **📱 Live Mobile App (PWA)**: [https://hienphuong99.github.io/phongtro/?mode=mobile](https://hienphuong99.github.io/phongtro/?mode=mobile)
- **📲 Native Mobile App (Expo Go)**: `exp://192.168.0.23:8081` (thư mục [`mobile-expo/`](./mobile-expo))
- **⚡ Google Apps Script Web App (Độc lập 100%)**: [https://script.google.com/macros/s/AKfycby47GcffVwe7MW4saPvL5chdA2sdswe5VzKIFIuPSfuG1RGS1Tw9wMU09UX-H8gV9ea/exec](https://script.google.com/macros/s/AKfycby47GcffVwe7MW4saPvL5chdA2sdswe5VzKIFIuPSfuG1RGS1Tw9wMU09UX-H8gV9ea/exec)
- **📊 Google Sheets Database (7 trang tính)**: [https://docs.google.com/spreadsheets/d/19mgIN7Xki9-FR9zb6cMwy9WMB78Gy4I1BJna7qvNB5g/edit](https://docs.google.com/spreadsheets/d/19mgIN7Xki9-FR9zb6cMwy9WMB78Gy4I1BJna7qvNB5g/edit)

---

## 🌐 Nhúng Toàn Trang Trên Google Sites (`google-sites/`)

Tương tự hệ thống **Chấm công & Tính lương (`sites.google.com/view/phuonghihi-staff`)** và **Web bán hàng (`sites.google.com/view/phuonghihi`)**, dự án không dùng Netlify (tránh phát sinh chi phí) mà triển khai miễn phí 100% qua **GitHub Pages + Google Sites + Google Apps Script**:

| Tệp nhúng Google Sites | Đường dẫn nguồn nhúng | Mô tả |
| :--- | :--- | :--- |
| [`google-sites/embed-web-admin.html`](./google-sites/embed-web-admin.html) | `https://hienphuong99.github.io/phongtro/` | Nhúng toàn trang giao diện Web Quản trị OptiRent lên Google Sites |
| [`google-sites/embed-mobile-app.html`](./google-sites/embed-mobile-app.html) | `https://hienphuong99.github.io/phongtro/?mode=mobile` | Nhúng giao diện Mobile PWA tối ưu cho điện thoại lên Google Sites |

---

## ✨ 8 Phân Hệ Nghiệp Vụ Hoàn Chỉnh (Khớp 100% Video `Phongtro.mp4`)

1. **📊 Tổng quan (Dashboard)**:
   - Tỷ lệ lấp đầy **`75% (9/12 phòng)`**, Thu hôm nay (`0 đ` → tăng tức thì lên `+6.961.800 đ` sau khi thu nợ P101), Lợi nhuận tháng này (`-1.050.000 đ` → `+5.911.800 đ`).
   - Danh sách **7 Việc cần làm hôm nay** với nút hành động 1 chạm (`Ghi chỉ số`, `Lập hóa đơn`, `Gửi`, `Xem công nợ`, `Thu nợ`, `Xem`, `Xem sơ đồ`).
2. **🗓️ Lịch vận hành (Calendar)**:
   - Theo dõi lịch ghi chỉ số điện nước (mùng 1–5 hàng tháng), hạn thanh toán hóa đơn, ngày hết hạn hợp đồng và lịch bảo trì phòng.
3. **🚪 Phòng (`12 phòng · 3 tầng`)**:
   - Sơ đồ trực quan theo Tầng 1 (`P101–P104`), Tầng 2 (`P201–P204`), Tầng 3 (`P301–P304`).
   - Thống kê doanh thu hợp đồng `22.500.000 đ/tháng`, thất thu phòng trống `5.200.000 đ/tháng` (`P202`, `P304`), phòng đang sửa chữa `P204`.
4. **👥 Khách thuê & Danh sách xe (`26 khách · 9 xe máy`)**:
   - Quản lý khách đại diện & người ở cùng (`KH-00001..KH-00026`), CCCD, SĐT, trạng thái cư trú.
   - Quản lý 9 xe máy (`59X1-10000..59X1-27544`) theo từng phòng.
   - Xuất **Tờ khai thay đổi thông tin cư trú (Mẫu CT01)** chỉ với 1 nút bấm.
5. **📄 Hợp đồng & Tính tiền kỳ đầu Pro-rata (`10 hợp đồng`)**:
   - 9 hợp đồng đang hiệu lực (`HD-00001..HD-00009`) và 1 hợp đồng đã thanh lý chờ hoàn cọc (`HD-00010` — `Huỳnh Thị Hà` — `P202`).
   - Modal **Tạo hợp đồng mới** tự động chia tiền phòng kỳ đầu theo số ngày ở thực tế (**Pro-rata**: vào ở ngày `11/10` → cuối tháng `31/10` = `21/31 ngày` = **`1.693.548 đ`**).
6. **🧾 Hóa đơn, Ghi điện nước hàng loạt & Thông báo VietQR/Zalo**:
   - Quản lý hóa đơn qua 3 kỳ `2026-09`, `2026-10`, `2026-11`.
   - Modal **Ghi chỉ số hàng loạt** tính tự động sản lượng điện (`3.500 đ/kWh`), nước (`18.000 đ/m³`), rác & Wifi.
   - Modal **Thông báo thanh toán** tự tạo phiếu báo kèm mã **VietQR** và mẫu tin nhắn **Zalo** 1 chạm.
7. **💰 Tài chính & Thu tiền tự động trừ nợ cũ nhất trước (FIFO)**:
   - 4 phân hệ con: **Sổ thu chi**, **Quỹ**, **Công nợ (`65.622.900 đ`)**, **Cọc phải trả (`909.334 đ`)**.
   - Thuật toán **Thu tiền FIFO**: khi thu `6.961.800 đ` của phòng `P101`, hệ thống tự động phân bổ trừ từ hóa đơn cũ nhất trước:
     - Kỳ `2026/09` (`HD-IV-00052`): trừ `1.163.800 đ` → **Đã thu đủ**
     - Kỳ `2026/10` (`HD-IV-00070`): trừ `2.870.000 đ` → **Đã thu đủ**
     - Kỳ `2026/11` (`HD-IV-00089`): trừ `2.928.000 đ` → **Đã thu đủ**
8. **📈 Báo cáo Doanh thu — Chi phí — Lợi nhuận**:
   - Tổng doanh thu thực thu `105.191.400 đ`, Chi phí `6.620.000 đ`, Lợi nhuận ròng `98.571.400 đ`.
   - Biểu đồ cột + đường từ `T6/2026` đến `T10/2026`, cơ cấu nguồn thu/khoản chi, bảng xếp hạng phòng hiệu quả nhất và phòng cần lưu ý.

---

## 🚀 Hướng Dẫn Chạy Nhanh (Web + Mobile Expo Go + Google Sheets)

### 1. Chạy Web Quản trị & Mobile PWA
```bash
npm install
npm run dev
npm run build
```

### 2. Chạy Native Mobile App trên **Expo Go** (`mobile-expo/`)
```bash
cd mobile-expo
npm install
npx expo start --port 8081
```
- Mở ứng dụng **Expo Go** trên Android hoặc **Camera** trên iOS và quét mã QR hiển thị trên terminal (hoặc truy cập trực tiếp `exp://192.168.0.23:8081`).
- Trên giao diện Web App cũng có sẵn nút **`📲 Chạy Expo Go`** ở góc phải thanh Topbar để bật mã QR quét nhanh bất cứ lúc nào.

### 3. Triển khai tự động 1 chạm (Google Sheets + Apps Script + GitHub Pages + E2E `agent-browser`)
```bash
npm run deploy
```

### 4. Bật đồng bộ Google Sheets (mã `SYNC_TOKEN`)
Apps Script chỉ đọc/ghi dữ liệu khi có mã đồng bộ dùng chung; chưa cấu hình mã thì mọi yêu cầu dữ liệu đều bị từ chối.
1. Mở Google Sheets → menu **🏠 OptiRent Quản Lý Trọ → 🔑 Tạo / xem mã đồng bộ (SYNC_TOKEN)** (hoặc chạy `setupSyncToken()` trong trình soạn thảo Apps Script). Mã được lưu trong *Script Properties*, không nằm trong repo.
2. Trên Web App: **Cài đặt → Kết nối & Đồng bộ Google Sheets → Mã đồng bộ**, dán mã rồi bấm **Đồng bộ ngay**. Mã chỉ lưu trong `localStorage` của trình duyệt đó.
3. API (body JSON gửi dạng `text/plain`, luôn kèm `token`): `syncState` (kèm `schema: "optirent-web-v1"` và `state`), `getState`, `resetSeed`. `GET ?action=getState&token=...` cũng dùng được. `?action=init` đã bị bỏ — nạp dữ liệu mẫu từ menu trên Google Sheets.
4. Đổi mã: xoá khóa `SYNC_TOKEN` trong *Project Settings → Script Properties* rồi chạy lại bước 1.

App Expo (`mobile-expo/`) dùng dữ liệu demo khác schema nên **không** đồng bộ lên Sheets.
