# Quản lý phòng trọ — Hệ Thống Quản Lý Phòng Trọ, Hợp Đồng, Điện Nước, VietQR & Thu Tiền FIFO

Hệ thống **Quản lý phòng trọ** hỗ trợ quản lý đa cơ sở (**Nhà trọ Bình An — Cơ sở Bình Thạnh** & **Khu trọ An Phú**), điều chỉnh giá thuê linh hoạt từng phòng hoặc hàng loạt, tính tiền phòng kỳ đầu theo ngày thực tế (**Pro-rata**), ghi chỉ số điện nước, gửi thông báo **VietQR / Zalo** và thu nợ tự động theo thứ tự hóa đơn cũ nhất trước (**FIFO**).

Hệ thống hoạt động đồng bộ trên **Web Quản trị**, **Mobile PWA**, ứng dụng di động **Expo Go (`mobile-expo/`)**, **Google Sites** và **Google Sheets (7 trang tính)** hoàn toàn miễn phí 100%.

- **🏢 Cơ sở vận hành**: **Nhà trọ Bình An** (`128 Nguyễn Văn Thương, Bình Thạnh, TP. Hồ Chí Minh`)
- **🚀 Live Web Quản trị (GitHub Pages)**: [https://hienphuong99.github.io/phongtro/](https://hienphuong99.github.io/phongtro/)
- **📱 Live Mobile App (PWA)**: [https://hienphuong99.github.io/phongtro/?mode=mobile](https://hienphuong99.github.io/phongtro/?mode=mobile)
- **📖 Hướng dẫn sử dụng**: [docs/HUONG-DAN-SU-DUNG.md](docs/HUONG-DAN-SU-DUNG.md)
- **📲 Expo Go (`mobile-expo/`)**: đã đóng băng, không dùng khi demo
- **⚡ Google Apps Script Web App (Độc lập 100%)**: [https://script.google.com/macros/s/AKfycby47GcffVwe7MW4saPvL5chdA2sdswe5VzKIFIuPSfuG1RGS1Tw9wMU09UX-H8gV9ea/exec](https://script.google.com/macros/s/AKfycby47GcffVwe7MW4saPvL5chdA2sdswe5VzKIFIuPSfuG1RGS1Tw9wMU09UX-H8gV9ea/exec)
- **📊 Google Sheets Database (7 trang tính)**: [https://docs.google.com/spreadsheets/d/19mgIN7Xki9-FR9zb6cMwy9WMB78Gy4I1BJna7qvNB5g/edit](https://docs.google.com/spreadsheets/d/19mgIN7Xki9-FR9zb6cMwy9WMB78Gy4I1BJna7qvNB5g/edit)

---

## 🌐 Nhúng Toàn Trang Trên Google Sites (`google-sites/`)

Dự án triển khai miễn phí 100% qua **GitHub Pages + Google Sites + Google Apps Script**:

| Tệp nhúng Google Sites | Đường dẫn nguồn nhúng | Mô tả |
| :--- | :--- | :--- |
| [`google-sites/embed-web-admin.html`](./google-sites/embed-web-admin.html) | `https://hienphuong99.github.io/phongtro/` | Nhúng toàn trang giao diện Web Quản lý phòng trọ lên Google Sites |
| [`google-sites/embed-mobile-app.html`](./google-sites/embed-mobile-app.html) | `https://hienphuong99.github.io/phongtro/?mode=mobile` | Nhúng giao diện Mobile PWA tối ưu cho điện thoại lên Google Sites |

---

## ✨ 8 Phân Hệ Nghiệp Vụ Chính

1. **📊 Tổng quan (Dashboard)**:
   - Tỷ lệ lấp đầy **`75% (9/12 phòng)`**, Thu hôm nay, Lợi nhuận tháng này, Công nợ cần thu và Cọc phải trả lại.
   - Danh sách **Việc cần làm hôm nay** với nút thao tác 1 chạm (`Ghi chỉ số`, `Lập hóa đơn`, `Gửi`, `Xem công nợ`, `Thu nợ`, `Xem`, `Xem sơ đồ`).
2. **🗓️ Lịch vận hành (Calendar)**:
   - Theo dõi lịch ghi chỉ số điện nước (mùng 1–5 hàng tháng), hạn thanh toán hóa đơn, ngày hết hạn hợp đồng và lịch bảo trì phòng.
3. **🚪 Phòng (`12 phòng · 3 tầng`) & Điều chỉnh giá thuê**:
   - Sơ đồ trực quan theo Tầng 1 (`P101–P104`), Tầng 2 (`P201–P204`), Tầng 3 (`P301–P304`).
   - Hỗ trợ **Sửa giá thuê từng phòng** (kèm nút tăng/giảm nhanh, áp dụng cho cả tầng, tự đồng bộ Hợp đồng và Hóa đơn chưa thu) hoặc **Bảng giá toàn bộ phòng** chỉnh sửa hàng loạt.
4. **👥 Khách thuê & Danh sách xe (`26 khách · 9 xe máy`)**:
   - Quản lý khách đại diện & người ở cùng (`KH-00001..KH-00026`), CCCD, SĐT, trạng thái cư trú.
   - Quản lý 9 xe máy (`59X1-10000..59X1-27544`) theo từng phòng.
   - Xuất **Tờ khai thay đổi thông tin cư trú (Mẫu CT01)** chỉ với 1 nút bấm.
5. **📄 Hợp đồng & Tính tiền kỳ đầu Pro-rata (`10 hợp đồng`)**:
   - Quản lý hợp đồng đang hiệu lực và hợp đồng đã thanh lý chờ hoàn cọc.
   - Modal **Tạo hợp đồng mới** kiểm tra đầy đủ SĐT (`0xxxxxxxxx`), CCCD (`12 chữ số`), ngày kết thúc hợp lệ, tự động chia tiền phòng kỳ đầu theo số ngày ở thực tế (**Pro-rata**) và tự động lập hóa đơn kỳ đầu tiên.
6. **🧾 Hóa đơn, Ghi điện nước hàng loạt & Thông báo VietQR/Zalo**:
   - Quản lý hóa đơn theo từng kỳ tháng.
   - Modal **Ghi chỉ số hàng loạt** kiểm tra chặt chẽ chỉ số mới không nhỏ hơn chỉ số cũ, tính tự động sản lượng điện (`3.500 đ/kWh`), nước (`18.000 đ/m³`), rác & Wifi.
   - Modal **Thông báo thanh toán** tự tạo phiếu báo kèm mã **VietQR** và mẫu tin nhắn **Zalo** 1 chạm.
7. **💰 Tài chính & Thu tiền tự động trừ nợ cũ nhất trước (FIFO)**:
   - 4 phân hệ con: **Sổ thu chi**, **Quỹ**, **Công nợ**, **Cọc phải trả**.
   - Thuật toán **Thu tiền FIFO**: khi thu tiền của một phòng, hệ thống tự động phân bổ trừ từ hóa đơn cũ nhất trước và tự động ghi bút toán vào Sổ thu chi.
8. **📈 Báo cáo Doanh thu — Chi phí — Lợi nhuận**:
   - Tổng hợp doanh thu thực thu, chi phí, lợi nhuận ròng và tỷ lệ lấp đầy theo từng cơ sở.
   - Biểu đồ cột + đường trực quan, cơ cấu nguồn thu/khoản chi, bảng xếp hạng phòng hiệu quả nhất và phòng cần lưu ý.

---

## 🚀 Hướng Dẫn Chạy Nhanh (Web + Mobile Expo Go + Google Sheets)

### 1. Chạy Web Quản trị & Mobile PWA
```bash
npm install
npm run dev
npm run build
```

### 2. Dùng trên điện thoại
- Bản di động là Web `?mode=mobile` (https://hienphuong99.github.io/phongtro/?mode=mobile). Nút **`📲 Mở trên điện thoại`** trên thanh Topbar hiện mã QR để quét.
- `mobile-expo/` (Expo Go) **đã đóng băng**: không bảo trì, không dùng khi demo (xem `docs/KE-HOACH-KINH-DOANH.md`, mục 5.4).

### 3. Triển khai tự động 1 chạm (Google Sheets + Apps Script + GitHub Pages + E2E `agent-browser`)
```bash
npm run deploy
```

### 4. Bật đồng bộ Google Sheets (mã `SYNC_TOKEN`)
Apps Script chỉ đọc/ghi dữ liệu khi có mã đồng bộ dùng chung; chưa cấu hình mã thì mọi yêu cầu dữ liệu đều bị từ chối.
1. Mở Google Sheets → menu **🏠 Quản lý phòng trọ → 🔑 Tạo / xem mã đồng bộ (SYNC_TOKEN)**. Mã được lưu trong *Script Properties*, không nằm trong repo.
2. Trên Web App: **Cài đặt → Kết nối & Đồng bộ Google Sheets → Mã đồng bộ**, dán mã rồi bấm **Đồng bộ ngay**. Mã chỉ lưu trong `localStorage` của trình duyệt đó.
3. API (body JSON gửi dạng `text/plain`, luôn kèm `token`): `syncState` (kèm `schema: "quanlyphongtro-web-v1"` và `state`), `getState`, `resetSeed`. `GET ?action=getState&token=...` cũng dùng được. `?action=init` đã bị bỏ — nạp dữ liệu mẫu từ menu trên Google Sheets.
4. Đổi mã: xoá khóa `SYNC_TOKEN` trong *Project Settings → Script Properties* rồi chạy lại bước 1.

App Expo (`mobile-expo/`) dùng dữ liệu demo khác schema nên **không** đồng bộ lên Sheets.
