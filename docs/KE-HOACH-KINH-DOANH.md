# Kế hoạch kinh doanh OptiRent — bản v2 (11/2026 → 10/2027)

Bản v1 lập ngày 17/10/2026. Bản v2 cập nhật ngày 18–19/10/2026, sau một bản đánh giá phản biện (tóm tắt và phản hồi ở **Phụ lục A**) và đợt sửa code ngày 18–19/10. Tên hiển thị của app đã đổi từ "OptiRent" thành "Quản lý phòng trọ"; tài liệu này vẫn gọi là OptiRent cho tới khi chọn tên thương hiệu chính thức.

Số liệu thị trường lấy từ báo chí và trang của đối thủ, đăng trong năm 2026 (danh sách nguồn ở cuối). Văn bản luật mới đọc qua báo, **chưa đối chiếu văn bản gốc**. Chỗ có dấu ⚠️ là số liệu mâu thuẫn hoặc chưa kiểm chứng.

---

## 0. Tóm tắt

1. **Thông điệp bán hàng mới: "Chốt sổ 20–60 phòng trong vài phút qua Zalo, không nhầm nợ cũ, không phải dò sao kê."** Chủ trọ trả tiền cho 3 việc: lấp phòng trống nhanh, thu đủ tiền, đỡ mệt mỗi đầu tháng. Họ không trả tiền để "tuân thủ luật". Các quy định 2026 (giá điện, thuế, lưu trú, dữ liệu cá nhân) vẫn có trong app nhưng chạy ngầm, không dùng để quảng cáo.
2. **Khách hàng mục tiêu mới: chủ trọ 30–45 tuổi, quản lý 20–60 phòng hoặc 2–3 khu, vẫn đang đi làm.** Dưới 20 phòng thì sổ tay + Zalo vẫn đủ dùng và miễn phí. Nhóm mới thiếu thời gian, quen công nghệ, và trả 150–250k/tháng không phải đắn đo nhiều.
3. **App vẫn là bản demo.** Đợt sửa ngày 18–19/10 đã:
   - Khóa API Apps Script bằng mã bí mật, và chặn việc gọi thẳng hàm nội bộ qua `google.script.run` (trước đó người lạ lấy được cả mã bí mật).
   - Sửa đồng bộ Google Sheets cho chạy thật.
   - Tắt đồng bộ của app Expo.
   - Sửa cả 7 lỗi đã ghi nhận.

   Vẫn chưa có đăng nhập, chưa tách dữ liệu theo từng chủ trọ, dữ liệu vẫn nằm trong trình duyệt.
4. **Hai tuần tới không viết thêm tính năng.** Bản khóa API Apps Script (`@13`) và Web đã triển khai xong ngày 19/10/2026; việc tiếp theo là đổi `SYNC_TOKEN` trên Google Sheets và mang bản demo đi gặp 15 chủ trọ. Tháng 11 chỉ làm phần nền: đăng nhập, phân quyền dữ liệu, chuyển sang database thật, kiểm thử phần tính tiền.
5. **Mục tiêu thực tế sau 12 tháng: 60–100 chủ trọ trả phí, trung bình khoảng 180k/khách/tháng, tức khoảng 11–18 triệu/tháng.** Không đặt mục tiêu có khách trả phí trước Tết (06/02/2027). Mốc tháng 1/2027 là 5 chủ trọ beta chạy được kỳ thu tiền thật. Mở bán chính thức sau Tết, đúng mùa chuyển trọ.

---

## 1. Thay đổi so với bản v1

| Chủ đề | Bản v1 | Bản v2 | Lý do |
|---|---|---|---|
| Thông điệp | "Quản lý trọ đúng luật 2026" | "Chốt sổ nhanh, không nhầm nợ, không dò sao kê" | Chủ trọ né chuyện luật chứ không mua vì luật |
| Phân khúc | Chủ trọ gia đình 8–30 phòng, 45–65 tuổi | 20–60 phòng hoặc nhiều khu, 30–45 tuổi, vẫn đi làm | Dưới 20 phòng chỉ mất khoảng 1,5 giờ/tháng, khó bán |
| Giá | 99k (≤20 phòng) | Miễn phí ≤10 phòng · 149k ≤30 · 249k ≤60 | Không cạnh tranh với gói miễn phí ≤15 phòng của đối thủ; nhóm mới trả được cao hơn |
| Tháng 11 | Backend + nhập Excel trên web + onboarding đầy đủ | Chỉ đăng nhập + phân quyền + chuyển dữ liệu + kiểm thử tính tiền; nhập liệu hộ bằng script | 80–100 giờ không đủ làm hết |
| Mốc 20/01/2027 | Có khách trả phí trước Tết | 5 chủ trọ beta chạy kỳ thu tiền thật | Khả năng trễ quá cao |
| Báo có tự động | SePay/Casso, giá chưa rõ | Làm 2 cách: tải sao kê lên để khớp (0đ) trước, SePay OAuth sau | SePay miễn phí ≤50 giao dịch/tháng nhưng hướng dẫn liên kết ngân hàng rất vất vả |
| Hỗ trợ mùng 1–5 | Chưa tính | Có kế hoạch riêng (mục 7) | Hỗ trợ dồn vào đúng giờ đi làm |
| Kênh môi giới | Hoa hồng 20–30% năm đầu | Bỏ | Khoảng 300k không đủ hấp dẫn môi giới |

Bản v2 làm theo 6 điểm của bản đánh giá và phản biện 3 điểm: chi phí SePay, cách xử lý tiền điện, cách xử lý thuế. Chi tiết ở **Phụ lục A** và vòng phản biện tiếp theo ở **Phụ lục C**.

---

## 2. Hiện trạng sản phẩm (19/10/2026)

### 2.1 Những gì đã có

| Phân hệ | Đã có | Ghi chú |
|---|---|---|
| Tổng quan, Lịch | Lấp đầy, thu hôm nay, lợi nhuận, việc cần làm, lịch ghi số / hạn thu / hết hạn hợp đồng | Dùng tốt để demo |
| Phòng | Sơ đồ theo tầng, chỉnh giá lẻ/hàng loạt, đồng bộ sang hợp đồng và hóa đơn chưa thu | Hợp với mùa tăng giá sau Tết |
| Khách thuê & xe | Khách đại diện/ở cùng, CCCD, xe, mẫu CT01 | — |
| Hợp đồng | Tạo hợp đồng, có ô SĐT/CCCD, kiểm tra ngày, tự sinh hóa đơn kỳ đầu theo số ngày ở | Lỗi #4–#6 đã sửa |
| Hóa đơn | Ghi chỉ số hàng loạt (chặn khi chỉ số mới < cũ), phiếu báo VietQR, tin Zalo soạn sẵn | Lỗi #3 đã sửa |
| Tài chính | Sổ thu chi, quỹ, công nợ, cọc phải trả, thu tiền FIFO | FIFO là điểm mạnh thật |
| Báo cáo | Doanh thu, chi phí, lợi nhuận, xếp hạng phòng | — |
| Nhiều cơ sở | Đổi cơ sở thì mọi màn hình chỉ hiện dữ liệu cơ sở đó | Lỗi #1 đã sửa, quan trọng với phân khúc nhiều khu |
| Đồng bộ Google Sheets | Gửi kèm mã `SYNC_TOKEN`, báo lỗi thật, dữ liệu web được ghi đúng cột | Đã triển khai Apps Script `@13` ngày 19/10 |
| Cảnh báo | Thanh "Bản demo" ở đầu trang; cảnh báo khi giá điện > 3.460 đ/kWh | Dữ liệu mẫu vẫn để 3.500 đ/kWh |

### 2.2 Còn thiếu để bán được

1. **Đăng nhập và tách dữ liệu theo chủ trọ.** Hiện cả hệ thống dùng chung một Google Sheet.
2. **Dữ liệu chỉ nằm trong trình duyệt.** Đồng bộ Sheets mới chỉ là bản sao lưu một chiều.
3. **Ngày và kỳ bị gắn cứng.** "Hôm nay" luôn là 11/10/2026. Bộ chọn kỳ chỉ có 09–11/2026, cộng thêm kỳ của hóa đơn mới tạo.

### 2.3 Trạng thái triển khai (19/10/2026)

| Thành phần | Trạng thái | Ghi chú |
|---|---|---|
| Code trên `main` | Đã merge (PR #1, commit `e3966f9` & `2674d1d`) | Gộp bản sửa của 2 phiên làm việc: giữ bản của `main`, thêm phần còn thiếu |
| Web (GitHub Pages) | **Đã triển khai** | Workflow chạy thành công ngày 19/10; https://hienphuong99.github.io/phongtro/ đang chạy bản mới |
| Apps Script Web App | **Đã triển khai (`@13`)** | Đã cập nhật deployment `AKfycby47GcffVwe7MW4saPvL5chdA2sdswe5VzKIFIuPSfuG1RGS1Tw9wMU09UX-H8gV9ea` lên version `@13` ngày 19/10; đã kiểm chứng `GET ?action=getState`, `POST` sai mã trả về `UNAUTHORIZED`, và `setupSyncToken()` trên server gọi `assertSheetUi_()` ở dòng đầu |
| Mã `SYNC_TOKEN` | **Cần chủ dự án tự đổi** | Mã cũ (nếu có) có thể đã lộ trước bản `@13`. Xoá khóa trong Script Properties, rồi tạo lại bằng menu 🔑 trên Google Sheets |
| Dữ liệu Google Sheets | Không đổi | Không chạy `seed:sheets` |

---

## 3. Khách hàng

### 3.1 Chân dung mục tiêu

| | Mô tả |
|---|---|
| Ai | 30–45 tuổi, quản lý 20–60 phòng hoặc 2–3 khu (thường của gia đình), vẫn đi làm hành chính hoặc kinh doanh khác |
| Đang dùng | Excel/Google Sheets tự làm, nhóm Zalo với khách, app ngân hàng để dò tiền |
| Nỗi đau | Mất nửa ngày đến 1 ngày đầu tháng; nhầm ai đã trả ai chưa khi khách trả lẻ hoặc trả gộp nhiều tháng; nhiều khu thì phải mở nhiều file; người nhà quản lý giúp thì không biết số liệu |
| Sẵn sàng trả | 150–250k/tháng nếu thật sự đỡ được thời gian đầu tháng |
| Rào cản | Ngại nhập liệu lại từ đầu; sợ lộ doanh thu; sợ liên kết tài khoản ngân hàng với app lạ |

**Không nhắm tới (năm đầu):** chủ trọ dưới 15 phòng (dùng gói miễn phí nếu muốn), CHDV cao cấp trên 100 phòng (đã có SmartOS, cần booking).

### 3.2 Hành vi cần thiết kế theo

- **Chu kỳ tháng:** ghi số từ mùng 1–5, gửi phiếu ngay sau đó, thu đến khoảng ngày 10. Ngoài những ngày này, chủ trọ gần như không mở app.
- **Người thuê không cài app.** Mọi thứ gửi cho người thuê là link mở trong Zalo.
- **Đối soát chuyển khoản là việc mất thời gian nhất** với nhà trên 20 phòng: khách ghi nội dung lung tung, trả thiếu, trả gộp.
- **Rất cảnh giác về dữ liệu.** Phải nói rõ: dữ liệu là của chủ trọ, xuất hoặc xóa được bất cứ lúc nào, không chia sẻ cho ai, kể cả cơ quan thuế.
- **Mùa vụ:**
  - Sau Tết là mùa chuyển trọ và tăng giá (đầu 2026: lượt tìm phòng ở TP.HCM tăng 130%, phòng bình dân 2–4 triệu tăng 10–20%).
  - Tháng 6–7 sinh viên trả phòng.
  - Tháng 8–9 mùa nhập học.

### 3.3 Quy định 2026: tính năng chạy ngầm, không làm mồi bán hàng

| Quy định (theo báo chí) | Cách app xử lý |
|---|---|
| **NĐ 133/2026** (từ 25/5/2026): phạt 20–30 triệu nếu thu tiền điện cao hơn giá bán lẻ, buộc hoàn trả | Đã có cảnh báo ở trang Cài đặt. Sẽ thêm công cụ "tính lại cơ cấu giá": điện đúng giá + 10% hao hụt, cộng phí dịch vụ thật có trong hợp đồng, tách dòng trên phiếu, giữ gần nguyên thu nhập |
| **Thuế cho thuê nhà 2026**: bỏ khoán, tự kê khai; ngưỡng miễn thuế ⚠️ 500 triệu hay 1 tỷ/năm (NĐ 141/2026) | Báo cáo doanh thu theo kỳ, chỉ tạo khi chủ trọ bấm. Không làm mồi bán hàng |
| **Luật Cư trú sửa đổi** (từ 1/7/2026): thông báo lưu trú, phạt 500k–1 triệu/người | Danh sách "ai chưa khai báo", xuất các trường cần khai. Không hứa tích hợp VNeID |
| **Luật BVDLCN** (từ 1/1/2026): phạt tới 3 tỷ | Đây là rủi ro của mình (bên cung cấp phần mềm), không phải lý do chủ trọ mua. Vẫn bắt buộc làm: phân quyền dữ liệu, mã hóa ảnh CCCD, phiếu đồng ý, xóa dữ liệu khi khách trả phòng lâu |

---

## 4. Đối thủ và định vị

| Đối thủ | Giá công khai (đọc 10/2026) | Mạnh | Khe hở cho OptiRent |
|---|---|---|---|
| MONA House | Thử 30 ngày; 11–20 phòng 490k, 21–50 phòng 890k/tháng | Báo có tự động khoảng 5 giây, OCR đồng hồ, khoảng 700 chủ trọ | Đắt với nhà 20–50 phòng |
| Quản Lý Trọ | Miễn phí ≤15 phòng, bản có phí không công bố giá | Gói miễn phí rộng | Bản miễn phí có quảng cáo, gửi Zalo thủ công |
| SmartOS | 360k (20 phòng), 1,5 triệu (100 phòng) | CHDV, booking | Nặng với nhà trọ |
| Room Easy | 90k/tháng (20 phòng) | Rẻ | Không thấy báo có tự động |

**Định vị:** *OptiRent: chốt sổ 20–60 phòng trong vài phút, gạch nợ đúng thứ tự (FIFO), không phải dò sao kê. Giá bằng khoảng 1/3 MONA.*

Điểm khác biệt có thật trong code: gạch nợ FIFO khi khách trả gộp hoặc trả thiếu, chỉnh giá hàng loạt đồng bộ sang hợp đồng, xem riêng từng khu, tính tiền kỳ đầu theo ngày ở.

---

## 5. Tính năng (theo thứ tự ưu tiên)

### 5.1 Đã xong ngày 18–19/10/2026

- Khóa API Apps Script bằng `SYNC_TOKEN`. Các hàm nội bộ đổi sang dạng private để `google.script.run` không gọi được. Các hàm của menu (kể cả hàm tạo mã) chỉ chạy được trong Google Sheets và không trả mã về cho người gọi.
- Đồng bộ Sheets chạy thật và báo lỗi thật. Dữ liệu web được ghi đúng cột. JSON được chia nhiều dòng để tránh giới hạn 50.000 ký tự mỗi ô.
- Tắt đồng bộ của app Expo.
- Sửa 7 lỗi trong danh sách dogfood. Thêm thanh "Bản demo" và cảnh báo giá điện.

### 5.2 P0: tháng 11/2026 (chỉ phần nền)

| # | Hạng mục | Ước lượng |
|---|---|---|
| 1 | Supabase: schema Postgres + Auth (đăng nhập Google hoặc email) + Row Level Security theo `owner_id`. Viết test cho RLS: tài khoản A không đọc được dữ liệu B | 1,5–2 tuần |
| 2 | Chuyển đọc/ghi từ `localStorage` sang Supabase: trạng thái đang tải, báo lỗi, không mất dữ liệu khi mạng chập chờn | 1–1,5 tuần |
| 3 | Kiểm thử tự động cho phần tính tiền: hóa đơn, FIFO, pro-rata, hoàn cọc, chỉnh giá. Sai 1 đồng là mất khách | 3–4 ngày |
| 4 | "Hôm nay" theo ngày thật, kỳ hóa đơn sinh theo tháng (gỡ các chỗ gắn cứng `'2026-10'`) | 2–3 ngày |
| 5 | Script nhập liệu hộ chạy trên máy của bạn: nhận file Excel hoặc ảnh sổ qua Zalo, đẩy thẳng vào Supabase. **Không làm giao diện nhập Excel trên web** | 2 ngày |

**Không làm trong tháng 11:** giao diện onboarding đầy đủ, nhập Excel trên web, báo có tự động, app native.

### 5.3 P1: tháng 12/2026 – 3/2027

1. **Khớp chuyển khoản không tốn phí bên thứ ba.** VietQR có sẵn mã hóa đơn trong nội dung chuyển khoản. Chủ trọ tải file sao kê (Excel/CSV từ app ngân hàng) lên, app tự khớp theo mã và số tiền rồi gạch nợ FIFO. Dòng nào không khớp thì cho chủ trọ chọn tay.
2. **Tự sửa/huỷ hóa đơn, gửi lại phiếu** mà không cần gọi hỗ trợ (giảm tải mùng 1–5).
3. **Trang hóa đơn cho người thuê** mở trong Zalo: phiếu báo, QR, ảnh đồng hồ, lịch sử trả tiền.
4. **Tổng quan nhiều khu:** một màn hình xem tất cả khu (đã thu / còn nợ / phòng trống).
5. **Tài khoản phụ cho người nhà hoặc người quản lý:** chỉ ghi số và thu tiền, không xem báo cáo lợi nhuận.
6. **Công cụ tính lại cơ cấu giá điện** (mục 3.3).
7. **SePay OAuth** (sau khi SePay duyệt `client_id`): chủ trọ tự có tài khoản SePay. Gói FREE 50 giao dịch/tháng, không giới hạn số tài khoản ngân hàng, hỗ trợ 12 ngân hàng. App đọc giao dịch thay chủ trọ. Chỉ bật cho người tự nguyện, vì liên kết ngân hàng là rào cản lớn.

### 5.4 P2: từ tháng 4/2027, khi có trên 40 khách trả phí

- Đăng tin phòng trống từ dữ liệu phòng.
- Nhắc nợ qua Zalo ZNS (khoảng 200–300đ/tin ⚠️).
- Danh sách lưu trú.
- Báo cáo doanh thu theo kỳ khai thuế.
- OCR đồng hồ.

**Không làm năm đầu:** app native trên store, sàn tìm phòng, thu hộ tiền (cần giấy phép), AI chatbot.

---

## 6. Doanh thu và chi phí

### 6.1 Bảng giá đề xuất (kiểm chứng khi phỏng vấn và lúc mở beta)

| Gói | Giá | Giới hạn | Ghi chú |
|---|---|---|---|
| Miễn phí | 0đ | ≤ 10 phòng, 1 khu | Không có khớp sao kê, không có tài khoản phụ |
| **Tiêu chuẩn** | **149k/tháng** (1,49 triệu/năm) | ≤ 30 phòng, 3 khu | Đầy đủ P1 |
| **Chuyên nghiệp** | **249k/tháng** (2,49 triệu/năm) | ≤ 60 phòng, không giới hạn khu | + tài khoản phụ, SePay (nếu vượt 50 giao dịch thì phí SePay đã tính trong giá) |
| Trên 60 phòng | Từ 399k/tháng | Thỏa thuận | — |
| Nhập liệu hộ | Miễn phí cho 30 khách đầu, sau đó 300–500k/lần | — | Cũng là cách hiểu các trường hợp đặc biệt |

Ước tính trung bình khoảng 180k/khách/tháng (phần lớn ở gói 149k, một phần ở gói 249k).

### 6.2 Chi phí cố định (⚠️ quy đổi khoảng 26.000đ/USD, cần kiểm tra lại)

| Khoản | Chi phí |
|---|---|
| Supabase Pro (khi có khách thật) | khoảng 25 USD ≈ 650k/tháng |
| Tên miền + email | khoảng 300–800k/năm |
| Hosting web | 0đ |
| Khớp sao kê tự làm | 0đ |
| SePay | 0đ nếu chủ trọ dùng gói FREE của chính họ (≤50 giao dịch/tháng); 120k/tháng cho gói STARTUP nếu vượt |
| Luật sư rà chính sách bảo mật và điều khoản | khoảng 2–5 triệu (một lần) |
| Marketing | 1–3 triệu/tháng (chủ yếu in ấn, quà giới thiệu) |

**Tổng chi cố định khoảng 1–1,5 triệu/tháng, chưa tính công của bạn.** Hòa vốn tiền mặt ở khoảng 10–15 khách trả phí.

---

## 7. Hỗ trợ khách mùng 1–5 (người làm bán thời gian)

Hỗ trợ sẽ dồn vào mùng 1–5, đúng giờ bạn đi làm. Cách xử lý:

1. **Giới hạn số khách:** tối đa 10 khách beta tới hết tháng 1/2027, tối đa 40 khách tới tháng 6/2027.
2. **Không phát hành bản mới từ ngày 25 tới mùng 5.** Chỉ sửa lỗi chặn.
3. **Cho khách tự xử lý:** tự sửa/huỷ hóa đơn, tự gửi lại phiếu, tự chỉnh chỉ số (P1 #2). Có trang câu hỏi thường gặp và video 1 phút cho từng thao tác.
4. **Trang trạng thái và tin nhắn chung:** khi có lỗi chung, nhắn một tin vào nhóm Zalo khách hàng thay vì trả lời từng người.
5. **3 tháng đầu xin nghỉ hoặc làm từ xa mùng 1–2.** Dành sẵn buổi tối mùng 1–5 cho hỗ trợ.
6. **Hẹn giờ phản hồi rõ ràng:** trong 2 giờ với lỗi chặn thu tiền, trong 24 giờ với câu hỏi thường.

---

## 8. Kênh bán hàng

1. **Phỏng vấn và gặp trực tiếp:** người quen, người quen giới thiệu, chủ CHDV/chung cư mini quanh khu công nghiệp và làng đại học.
2. **Nhóm Facebook/Zalo của chủ nhà trọ, CHDV:** nội dung thực dụng như "chốt sổ 30 phòng trong 10 phút", "khách trả gộp 3 tháng thì gạch nợ thế nào", "tăng giá sau Tết đúng hợp đồng".
3. **Giới thiệu bạn bè:** mỗi lần giới thiệu thành công, cả hai được tặng 1 tháng.
4. **Kế toán dịch vụ cho hộ kinh doanh:** chỉ thử với 1–2 văn phòng. Không trông vào kênh này.
5. **Quảng cáo trả tiền:** chưa chạy trước tháng 4/2027.

Đã bỏ: hoa hồng cho môi giới.

---

## 9. Kế hoạch từng tháng

Giả định: 1 người, bán thời gian khoảng 20–25 giờ/tuần, code bằng Claude Code. Không đạt điều kiện đi tiếp thì kéo dài tháng đó, không chạy theo lịch.

### 18/10 – 31/10/2026: Không code thêm, đi phỏng vấn

- **Kỹ thuật (khoảng 1 giờ):**
  - Merge và triển khai web: đã xong ngày 19/10.
  - Triển khai Apps Script: `npm run deploy:sheets`, tự làm hoặc giao cho Antigravity (Phụ lục B).
  - Đổi mã: xoá `SYNC_TOKEN` trong Script Properties → menu **🏠 Quản lý phòng trọ → 🔑 Tạo / xem mã đồng bộ** → chép mã vào trang Cài đặt của web.
  - Thử lại: mở `.../exec?action=getState` không kèm mã phải bị từ chối.
- **Phỏng vấn 15 chủ trọ** đúng phân khúc mới, dùng bản demo đang chạy (bộ câu hỏi ở mục 11).
  - Ở câu về giá điện và thuế: **quan sát thái độ**. Họ lo và muốn làm đúng, hay tìm cách né?
  - Ghi lại nguyên văn họ mô tả đầu tháng của mình.
- **Hỏi SePay:** nhắn bộ phận hỗ trợ: *"Tôi làm phần mềm quản lý trọ cho khoảng 50 chủ nhà, mỗi người một tài khoản ngân hàng. Điều kiện cấp OAuth client và chi phí thế nào?"* Hỏi Casso câu tương tự.
- **Pháp lý:** chọn tên thương hiệu ("Quản lý phòng trọ" là tên chung, không đăng ký nhãn hiệu được), tra trùng (Cục SHTT, WIPO), mua tên miền.
- **KPI:** 15 cuộc phỏng vấn; ≥ 5 người đồng ý dùng thử từ tháng 12; ≥ 3 người nói trả được ≥ 149k.
- **Điều kiện đi tiếp:** có ≥ 5 người đồng ý dùng thử. Nếu kết quả phỏng vấn cho thấy nỗi đau khác hẳn giả định, sửa kế hoạch trước khi code.

### Tháng 11/2026: Làm phần nền (P0)

- **Sản phẩm:** 5 hạng mục P0 (mục 5.2), không làm gì thêm.
- **Khách hàng:** nhận file hoặc ảnh sổ của 5 người beta, nhập hộ bằng script vào cuối tháng.
- **Pháp lý:** đăng ký hộ kinh doanh (lệ phí môn bài đã bỏ từ 2026), mở tài khoản ngân hàng riêng, soạn chính sách bảo mật và điều khoản.
- **KPI:**
  - Test RLS qua (tài khoản A không đọc được dữ liệu B).
  - Test tính tiền qua.
  - Chạy được 1 chu kỳ đầy đủ trên dữ liệu thật của 1 chủ trọ.
- **Ngân sách:** khoảng 1–3 triệu.
- **Nếu trễ:** dời beta sang kỳ tháng 1. Không cắt phần test.

### Tháng 12/2026: Beta trên dữ liệu thật

- **Sản phẩm:** khớp sao kê (P1 #1), tự sửa/huỷ hóa đơn (P1 #2), sửa lỗi phát sinh.
- **Khách hàng:**
  - 3–5 chủ trọ chạy kỳ thu tiền tháng 12.
  - Có mặt trực tiếp hoặc gọi video ngày họ chốt sổ.
  - Đo: số phút chốt sổ, tỷ lệ giao dịch khớp tự động, số lần phải gọi hỗ trợ.
- **Vận hành:** nhóm Zalo hỗ trợ; quy tắc không phát hành bản mới từ 25 tới mùng 5 bắt đầu áp dụng.
- **KPI:** chốt sổ ≤ 15 phút cho 30 phòng; ≥ 70% giao dịch tự khớp; mức hài lòng ≥ 8/10.

### Tháng 1/2027: Beta mở rộng + bán trước

- **Sản phẩm:** trang hóa đơn cho người thuê (P1 #3), tổng quan nhiều khu (P1 #4), luồng trả phòng trước Tết.
- **Khách hàng:**
  - Mở thêm tới 10 người beta.
  - **Bán trước gói năm** cho người beta với giá ưu đãi (ví dụ 1,2 triệu/năm cho gói Tiêu chuẩn, giữ giá trọn đời). Có từ 3 người trả trước trở lên là tín hiệu thật.
- **Tết 06/02/2027:** không phát hành bản mới từ khoảng 25/01.
- **KPI:** 5–10 người dùng kỳ tháng 1; ≥ 3 người trả trước.

### Tháng 2/2027: Tết + mở bán

- **Nửa đầu tháng:** trực hỗ trợ.
- **Sau Tết (mùa chuyển trọ):**
  - Mở bán chính thức với bảng giá ở mục 6.1.
  - Nội dung "tăng giá sau Tết đúng hợp đồng" (dùng tính năng chỉnh giá hàng loạt có sẵn).
- **KPI:** 10 khách trả phí.

### Tháng 3/2027

- **Sản phẩm:** tài khoản phụ cho người nhà/quản lý (P1 #5), công cụ tính lại giá điện (P1 #6).
- **Khách hàng:** khởi động chương trình giới thiệu bạn bè; thử với 1–2 văn phòng kế toán.
- **KPI:** 20 khách trả phí; tỷ lệ huỷ < 5%/tháng.

### Tháng 4/2027

- **Sản phẩm:** SePay OAuth cho người tự nguyện (P1 #7), nếu SePay đã duyệt.
- **Khách hàng:** gọi cho mọi khách không đăng nhập trong kỳ mùng 1–10. Thử quảng cáo 2–3 triệu nếu tỷ lệ chuyển sang trả phí từ dùng thử ≥ 20%.
- **KPI:** 28 khách trả phí.

### Tháng 5/2027

- **Sản phẩm:** bắt đầu P2 theo nhu cầu khách (đăng tin phòng trống hoặc nhắc nợ ZNS).
- **KPI:** 35 khách trả phí.

### Tháng 6/2027: Chuẩn bị mùa sinh viên trả phòng

- **Sản phẩm:** trả phòng hàng loạt, đăng tin phòng trống.
- **KPI:** 42 khách trả phí. Giới hạn số khách hỗ trợ được: 40–50.

### Tháng 7/2027

- **Vận hành:** rà lại các quy định đã đổi (thuế, điện, cư trú), cập nhật app nếu cần.
- **Khách hàng:** chiến dịch "lấp phòng trước mùa nhập học".
- **KPI:** 50 khách trả phí.

### Tháng 8/2027: Mùa nhập học

- **Khách hàng:** chiến dịch lớn nhất năm, đẩy mạnh giới thiệu bạn bè.
- **KPI:** 62 khách trả phí.

### Tháng 9/2027

- **KPI:** 72 khách trả phí; tỷ lệ huỷ < 4%/tháng.
- **Quyết định:** có cần người hỗ trợ bán thời gian không (khi vượt khoảng 60 khách).

### Tháng 10/2027: Tổng kết 12 tháng

- **Đánh giá:** doanh thu định kỳ (mục tiêu 11–18 triệu/tháng), tỷ lệ huỷ, chi phí có được một khách (CAC), giá trị vòng đời khách (LTV), số giờ bạn bỏ ra mỗi tuần.
- **Ba hướng:**
  1. Tiếp tục như nguồn thu nhập phụ.
  2. Tuyển người hỗ trợ và mở rộng khu vực.
  3. Tìm đối tác.
- **Ngưỡng:** tỷ lệ huỷ ≤ 3%/tháng và LTV/CAC ≥ 3 thì đáng đầu tư mở rộng.

### Bảng mục tiêu

| Tháng | Khách trả phí | Doanh thu định kỳ (khoảng 180k/khách) | Mốc |
|---|---|---|---|
| 10/2026 | 0 | 0 | Triển khai bản khóa API, 15 phỏng vấn |
| 11/2026 | 0 | 0 | Supabase + RLS + test tính tiền |
| 12/2026 | 0 (3–5 beta) | 0 | Khớp sao kê, tự sửa hóa đơn |
| 01/2027 | 0 (≥3 trả trước gói năm) | 0 | Trang hóa đơn cho khách, nhiều khu |
| 02/2027 | 10 | khoảng 1,8 triệu | Mở bán sau Tết |
| 03/2027 | 20 | khoảng 3,6 triệu | Tài khoản phụ, tính lại giá điện |
| 04/2027 | 28 | khoảng 5 triệu | SePay OAuth |
| 05/2027 | 35 | khoảng 6,3 triệu | P2 theo nhu cầu |
| 06/2027 | 42 | khoảng 7,6 triệu | Trả phòng hàng loạt |
| 07/2027 | 50 | khoảng 9 triệu | Cập nhật quy định |
| 08/2027 | 62 | khoảng 11 triệu | Mùa nhập học |
| 09/2027 | 72 | khoảng 13 triệu | Cân nhắc người hỗ trợ |
| 10/2027 | 60–100 | 11–18 triệu | Tổng kết |

---

## 10. Việc cần làm ngay

- [x] Merge PR #1 vào `main`, triển khai web lên GitHub Pages (19/10).
- [x] Triển khai Apps Script bằng `npm run deploy:sheets` lên version `@13` trên cùng deployment `AKfycby47GcffVwe7MW4saPvL5chdA2sdswe5VzKIFIuPSfuG1RGS1Tw9wMU09UX-H8gV9ea` (19/10).
- [ ] Đổi mã: xoá `SYNC_TOKEN` cũ, tạo lại bằng menu 🔑 trên Google Sheets, dán vào trang Cài đặt của web (chủ dự án tự thao tác để không lộ mã).
- [x] Thử: `.../exec?action=getState` và `POST` sai mã đều trả về `UNAUTHORIZED`; `clasp pull` xác nhận `assertSheetUi_()` trên server (19/10).
- [ ] Danh sách 30 chủ trọ 20–60 phòng (hoặc nhiều khu) để chọn 15 người phỏng vấn.
- [ ] Nhắn SePay và Casso hỏi về OAuth cho phần mềm nhiều chủ nhà.
- [ ] Chọn tên thương hiệu, tra trùng, mua tên miền.
- [ ] Hỏi 1 kế toán thuế để chốt ngưỡng 500 triệu hay 1 tỷ.

---

## 11. Bộ câu hỏi phỏng vấn (15–20 phút)

1. Anh/chị quản lý bao nhiêu phòng, mấy khu? Ai trực tiếp thu tiền? Anh/chị có đi làm không?
2. Kể lại đầu tháng trước: từ lúc ghi điện tới lúc thu đủ mất bao lâu? Khâu nào mệt nhất?
3. Có khách nào trả thiếu, trả gộp nhiều tháng, hoặc ghi nội dung chuyển khoản sai không? Xử lý thế nào?
4. Đang ghi chép bằng gì? Đã thử phần mềm nào chưa, vì sao bỏ?
5. Đang thu tiền điện bao nhiêu một số? Có biết quy định mới về giá điện cho thuê trọ không? *(Quan sát: lo lắng, muốn làm đúng, hay né?)*
6. Năm nay khai thuế cho thuê nhà thế nào? *(Quan sát: có ngại cho người khác thấy doanh thu không?)*
7. Nếu dùng app, anh/chị có ngại để dữ liệu phòng, tiền thuê lên đó không? Cần gì để yên tâm?
8. Nếu có công cụ chốt sổ trong vài phút và tự gạch nợ khi khách chuyển khoản, bao nhiêu tiền một tháng thì hợp lý? Bao nhiêu thì quá đắt?
9. Anh/chị có thể gửi file Excel hoặc ảnh sổ để mình nhập hộ dùng thử từ tháng 12 không?
10. Anh/chị biết chủ trọ nào khác có thể quan tâm không?

Không bán hàng trong buổi phỏng vấn. Sau 15 cuộc thì tổng hợp: 3 nỗi đau nhiều nhất, thái độ với luật điện/thuế, mức giá trung vị, mức độ ngại về dữ liệu.

---

## 12. Rủi ro

| Rủi ro | Khả năng | Cách giảm |
|---|---|---|
| Phỏng vấn cho thấy nhóm 20–60 phòng cũng không đủ đau để trả tiền | Trung bình | Dừng code, đổi phân khúc (ví dụ CHDV) trước tháng 11 |
| Tháng 11 trễ | Cao | Đã cắt phạm vi; nếu trễ thì dời beta sang tháng 1, không cắt test |
| Lỗi tính tiền | Trung bình | Test tự động cho phần tiền; có mặt cùng khách ở kỳ đầu |
| Lộ dữ liệu | Trung bình | RLS có test, mã hóa ảnh CCCD, triển khai bản khóa API ngay |
| Quá tải hỗ trợ mùng 1–5 | Cao | Mục 7: giới hạn khách, không phát hành bản mới, cho khách tự xử lý |
| Khách không chịu liên kết ngân hàng | Cao | Khớp sao kê / xác nhận biên lai 1 chạm là cách chính, SePay chỉ là tùy chọn |
| Hiểu sai luật | Trung bình | Cho phép cấu hình ngưỡng, ghi rõ "không phải tư vấn thuế/pháp lý" |

---

## 13. Nguồn tham khảo (đọc ngày 17–19/10/2026)

**Thị trường**
- [Nhà Tốt — giá thuê phòng trọ TP.HCM T10/2026](https://www.nhatot.com/thue-phong-tro-tp-ho-chi-minh)
- [Phongtro123 — Hà Nội 2026](https://phongtro123.com/tinh-thanh/ha-noi)
- [CafeBiz — tìm phòng trọ TP.HCM tăng 130% đầu 2026](https://cafebiz.vn/chuyen-gi-day-phong-tro-tphcm-duoc-tim-kiem-tang-130-dau-nam-2026-thi-truong-cho-thue-soi-dong-tro-lai-176260301183439152.chn)
- [Mogi — biến động giá sau Tết 2026](https://mogi.vn/news/bien-dong-gia-phong-tro-sau-tet-2026-284644/)
- [VnExpress — nhà trọ tăng giá trước mùa nhập học](https://vnexpress.net/nha-tro-tp-hcm-tang-gia-truoc-mua-nhap-hoc-5110826.html)

**Đối thủ**
- [MONA House](https://mona.house/)
- [Quản Lý Trọ — bảng giá](https://quanlytro.me/bang-gia.html)
- [SmartOS — bảng giá](https://smartos.space/gia-phan-mem-quan-ly-nha-tro-can-ho/)
- [Room Easy](https://www.nhatro.app/)

**Thanh toán**
- [SePay — bảng giá](https://sepay.vn/bang-gia.html)
- [SePay OAuth 2.0](https://developer.sepay.vn/en/sepay-oauth2/tong-quan)
- [SePay Bank Hub](https://developer.sepay.vn/vi/bankhub/bat-dau-nhanh)
- [Casso API](https://developer.casso.vn/english-v2-new/casso-api)

**Quy định**
- [ECN — thuế HKD cho thuê phòng trọ, cập nhật 7/2026 (NĐ 141/2026)](https://ecn.net.vn/tin-tuc/hkd-cho-thue-phong-tro-ke-khai-thue-tncn)
- [SmartOS — thuế kinh doanh nhà trọ (12/08/2026)](https://smartos.space/blog/thue-kinh-doanh-nha-tro/)
- [VnBusiness — giá điện vượt 3.460 đồng là sai quy định (06/05/2026)](https://vnbusiness.vn/nguoi-thue-tro-chu-y-gia-dien-vuot-3460-dong-la-sai-quy-dinh.html)
- [Tuổi Trẻ — chủ trọ thu tiền điện sai sẽ bị phạt nặng](https://tuoitre.vn/chu-tro-thu-tien-dien-sai-se-bi-phat-nang-nguoi-thue-va-chu-nha-deu-co-noi-niem-rieng-20260503075052179.htm)
- [Báo Văn Hóa — quy định lưu trú từ 1/7/2026](https://baovanhoa.vn/doi-song/chinh-thuc-tu-17-quy-dinh-moi-ve-luu-tru-qua-dem-tat-ca-nguoi-dan-can-nam-ro-242324.html)
- [The Leader — làm lộ dữ liệu cá nhân bị phạt tới 3 tỷ](https://theleader.vn/lam-lo-du-lieu-ca-nhan-nguoi-khac-bi-phat-toi-3-ty-dong-d40915.html)
- [Bảng giá ZNS (nhà cung cấp, 2026)](https://www.smsthuonghieu.com/gia-zns/)

---

## Phụ lục A. Bản đánh giá phản biện vòng 1 (18/10/2026) và phản hồi của Opus

Ngày 18/10/2026, bản v1 nhận được một bản đánh giá phản biện thẳng thắn. Bản đánh giá khen 4 điểm: nhập liệu hộ, bỏ app native, gạch nợ FIFO và chỉnh giá hàng loạt, điều kiện đi tiếp theo từng tháng. Nó cũng chỉ ra 5 "tử huyệt" có thể khiến 6 tháng làm việc chỉ đổi lại dưới 10 khách trả tiền. Dưới đây là tóm tắt từng ý và phản hồi.

### A.1 Tóm tắt bản đánh giá và phản hồi

| # | Bản đánh giá nói | Phản hồi | Thay đổi trong v2 |
|---|---|---|---|
| 1 | **Định vị sai.** Chủ trọ né chuyện luật chứ không mua vì luật. Cảnh báo giá điện chẳng khác gì nhắc họ "đang phạm pháp". Họ sợ lộ doanh thu với cơ quan thuế. Luật dữ liệu cá nhân là rủi ro của bên làm phần mềm, không phải nỗi đau của chủ trọ | **Đồng ý** với hướng định vị. **Không đồng ý** với cách xử lý điện và thuế (xem A.2) | Thông điệp mới: "Chốt sổ nhanh, không nhầm nợ, không dò sao kê". Luật chuyển thành tính năng chạy ngầm |
| 2 | **Phân khúc sai.** Nhà 15 phòng chỉ mất khoảng 1,5 giờ/tháng. Người 45–65 tuổi có nhiều thời gian. Từ 0đ lên 99k là bức tường lớn khi đối thủ miễn phí ≤15 phòng | **Đồng ý.** Ví dụ chính MONA dùng (26 phòng, 3 nhà) cũng thuộc nhóm lớn hơn | Phân khúc 20–60 phòng hoặc nhiều khu, 30–45 tuổi, vẫn đi làm. Giá: miễn phí ≤10, 149k ≤30, 249k ≤60 |
| 3 | **Tháng 11 quá tải.** 80–100 giờ không đủ cho Supabase + RLS + viết lại tầng dữ liệu + onboarding + nhập Excel + phỏng vấn + giấy tờ. Khả năng trễ mốc 20/01 trên 80% | **Đồng ý** | Tháng 11 chỉ làm đăng nhập + RLS + chuyển dữ liệu + test tính tiền. Nhập liệu hộ bằng script. Mốc tháng 1 là beta, không phải khách trả phí |
| 4a | **SePay/Casso** có thể ăn mất một nửa gói 99k, và hướng dẫn chủ trọ liên kết ngân hàng là cực hình | **Đồng ý một phần** (xem A.2) | Khớp sao kê (0đ) là cách chính, SePay OAuth chỉ là tùy chọn |
| 4b | **Hỗ trợ mùng 1–5** dồn vào giờ đi làm, chưa có phương án | **Đồng ý** | Thêm mục 7: giới hạn khách, không phát hành bản mới từ 25 tới mùng 5, cho khách tự sửa hóa đơn, nhóm Zalo chung, xin nghỉ mùng 1–2 |
| 4c | **Hoa hồng môi giới** khoảng 300k/năm không đủ hấp dẫn người quen ăn 2–4 triệu/giao dịch | **Đồng ý** | Bỏ kênh môi giới. Kênh kế toán chỉ thử |
| 5 | **Việc cần làm ngay:** dừng code 2 tuần, khóa Apps Script, mang demo đi phỏng vấn 15 người, hỏi SePay/Casso ngay | **Đồng ý.** Đã kiểm tra bảng giá SePay ngay hôm đó; phần khóa Apps Script đã làm xong trong code | Mục 9: hai tuần cuối tháng 10 không viết thêm tính năng |

### A.2 Ba điểm phản biện của Opus

**1. Chi phí SePay thấp hơn bản đánh giá lo ngại.** Bảng giá SePay (đọc ngày 18/10/2026):
- Gói FREE: 50 giao dịch/tháng, không giới hạn số tài khoản ngân hàng, hỗ trợ 12 ngân hàng (Vietcombank, BIDV, VietinBank, MB, ACB, TPBank…). Gói STARTUP từ 120k/tháng.
- SePay có OAuth 2.0 cho đối tác: chủ trọ tự có tài khoản SePay miễn phí và ủy quyền cho app đọc giao dịch. Mình không trả phí theo từng chủ trọ, nhưng cần SePay duyệt `client_id`.
- Nhà ≤50 phòng thường ≤50 giao dịch/tháng, nên phí bằng 0. Nhà trên 50 phòng tốn 120k/tháng, đã tính vào gói 249k.
- **Bản đánh giá đúng ở điểm hỗ trợ:** liên kết ngân hàng là rào cản lớn. Vì vậy v2 dùng cách bản đánh giá đề xuất làm cách chính: VietQR có mã hóa đơn, chủ trọ tải file sao kê lên để app tự khớp.

**2. Tiền điện: không "hợp thức hóa" bằng cách đổi tên khoản thu vượt.** Bản đánh giá đề xuất tách phiếu thành "tiền điện đúng giá" + "phí hao hụt/quản lý" để chủ trọ thu đủ số tiền cũ. Nếu khoản phí đó thực chất vẫn là tiền điện thì vẫn là thu vượt giá theo NĐ 133/2026: người thuê khiếu nại được, chủ trọ vẫn bị phạt 20–30 triệu và phải hoàn tiền. App làm vậy là dẫn khách vào chỗ bị phạt. Cách làm của v2:
- Tiền điện đúng giá, cộng 10% hao hụt và điện dùng chung như EVN hướng dẫn.
- Phí dịch vụ **thật** (vệ sinh, bảo trì, bơm nước, điện hành lang) ghi trong hợp đồng, tách dòng riêng trên phiếu.
- App tính sẵn cơ cấu giá mới để chủ trọ giữ gần như nguyên thu nhập.

Kết quả gần giống ý bản đánh giá ("là đồng minh của chủ trọ"), nhưng minh bạch và đứng vững nếu bị kiểm tra.

**3. Thuế: không làm "tối ưu thuế" theo nghĩa giấu doanh thu.** Đồng ý bỏ thuế khỏi thông điệp bán hàng. Lo ngại về lộ dữ liệu là đúng, nên phải cam kết: dữ liệu là của chủ trọ, xuất hoặc xóa được bất cứ lúc nào, không chia sẻ với ai. Nếu ngưỡng miễn thuế là 1 tỷ/năm ⚠️, phần lớn nhà 20–40 phòng nằm dưới ngưỡng. Khi đó báo cáo doanh thu có lợi cho chủ trọ vì giúp họ **chứng minh mình được miễn thuế**. Báo cáo chỉ tạo khi chủ trọ tự bấm.

Thêm một ý về dữ liệu cá nhân: đúng là rủi ro của bên làm phần mềm. Nhưng chính vì vậy nó vẫn nằm trong P0, dù không dùng để bán hàng.

### A.3 Việc cần kiểm chứng qua phỏng vấn

Một số điểm cả hai bên đều mới dựa trên suy luận. 15 cuộc phỏng vấn cuối tháng 10 phải trả lời được:
- Nhóm 20–60 phòng có thật sự mất nhiều thời gian đầu tháng và chịu trả 149–249k không?
- Thái độ với giá điện và thuế: lo và muốn làm đúng, hay né? (câu 5–6 ở mục 11)
- Mức độ ngại để dữ liệu doanh thu lên app.
- Bao nhiêu người chịu liên kết ngân hàng, và bao nhiêu người chỉ chịu tải sao kê lên.

---

## Phụ lục B. Lệnh triển khai Apps Script (Đã hoàn tất ngày 19/10/2026)

Lệnh triển khai dưới đây đã được Antigravity thực thi ngày 19/10/2026, phát hành version `@13` trên deployment `AKfycby47GcffVwe7MW4saPvL5chdA2sdswe5VzKIFIuPSfuG1RGS1Tw9wMU09UX-H8gV9ea` và xác thực chặn truy cập trái phép (`UNAUTHORIZED` & `assertSheetUi_()`).

```text
Nhiệm vụ: triển khai bản Apps Script mới nhất của repo phongtro lên Google Apps Script.
Web (GitHub Pages) đã triển khai xong, KHÔNG cần làm lại.

1. git checkout main && git pull origin main
   grep -c "function assertSheetUi_" apps-script/Code.gs   (phải ra 1)
2. npx @google/clasp --version; chưa đăng nhập thì npx @google/clasp login
   apps-script/.clasp.json phải có scriptId 1F8VbvEXaKWRxLeHQ5MpQXxdWt32tJicY36mz8GTJ-wR5ecg7hT74FhtL.
   Thiếu file này thì DỪNG và báo lại, không để script tạo dự án mới.
3. npm ci && npm run deploy:sheets
   Phải cập nhật deployment AKfycby47GcffVwe7MW4saPvL5chdA2sdswe5VzKIFIuPSfuG1RGS1Tw9wMU09UX-H8gV9ea, không tạo URL mới.
4. Kiểm tra (URL = .../macros/s/AKfycby47.../exec):
   a. curl -sL "$URL?action=getState"  → phải chứa UNAUTHORIZED
   b. curl -sL -X POST -H "Content-Type: text/plain" -d '{"action":"getState","token":"sai-ma"}' "$URL"  → phải chứa UNAUTHORIZED
   c. clasp pull vào thư mục tạm (không ghi đè apps-script/): setupSyncToken phải gọi assertSheetUi_() đầu tiên và không còn "return token".
   d. Có agent-browser thì chạy npm run test:e2e
5. Có file thay đổi thì commit trên nhánh task/deploy-apps-script,
   merge --no-ff vào main, push, xoá nhánh task.

KHÔNG chạy npm run seed:sheets. KHÔNG in/ghi log/commit giá trị SYNC_TOKEN. KHÔNG sửa apps-script/Code.gs.
Báo lại kết quả từng bước, deploymentId, số version mới, output của 4a và 4b.
```

---

## Phụ lục C. Bản đánh giá & phản biện vòng 2 (19/10/2026 — bởi Argon / Antigravity)

> **Mục tiêu của Phụ lục C**: Đối thoại trực tiếp với AI đối tác (Opus / Claude) để thống nhất các giả định sản phẩm, tài chính và lộ trình thực thi trước khi bước vào giai đoạn phỏng vấn khách hàng & viết code P0 tháng 11.

### C.1 Phản hồi đối với 3 điểm phản biện của Opus tại Phụ lục A.2

1. **Về Tiền điện (A.2 #2 — Tách thành Điện đúng giá + 10% hao hụt dùng chung + Phí dịch vụ thật cố định trong hợp đồng)**:
   - **ĐỒNG THUẬN 100%.** Phản biện của Opus tại A.2 #2 sắc bén và an toàn pháp lý hơn hẳn gợi ý ở vòng 1. Nếu thu phí quản lý/hao hụt biến thiên theo số kWh thì về bản chất vẫn là thu tiền điện vượt trần NĐ 133/2026. Chuyển sang phí dịch vụ cố định theo phòng/theo người ghi rõ trong Phụ lục Hợp đồng là hướng đi chuẩn xác.
2. **Về Thuế (A.2 #3 — Giúp chủ trọ chứng minh dưới ngưỡng miễn thuế)**:
   - **ĐỒNG THUẬN về nguyên tắc không làm tính năng "giấu doanh thu"**, nhưng **PHẢN BIỆN về toán học phân khúc** *(xem C.2 #2 bên dưới)*.
3. **Về Chi phí SePay & Khớp sao kê CSV/Excel (A.2 #1)**:
   - **ĐỒNG THUẬN việc tra cứu gói SePay Free 50 giao dịch/tháng**, nhưng **PHẢN BIỆN việc lấy "tải file sao kê CSV/Excel" làm luồng đối soát chính** và **PHẢN BIỆN việc gộp phí SePay trả phí 120k/tháng vào gói 249k** *(xem C.2 #1 và C.2 #4 bên dưới)*.

---

### C.2 Năm điểm phản biện mới cần chỉnh trong bản v2 (Gửi Opus xem xét)

#### 1. Luồng "Tải file sao kê CSV/Excel từ ngân hàng" (Mục 5.3 P1 #1) trái ngược hành vi dùng điện thoại của chủ trọ
- **Lý do thực tế**:
  - **90% chủ trọ kiểm tra tiền trọ trên điện thoại**: Các app Mobile Banking tại Việt Nam rất khó hoặc không cho xuất CSV/Excel trực tiếp (thường chỉ xuất PDF hoặc bắt đăng nhập Internet Banking trên máy tính để tải Excel).
  - **Thu tiền trọ là luồng nhỏ giọt từ mùng 1 đến mùng 10**: Khách chuyển khoản lúc 21h tối là nhắn Zalo *"Anh/chị ơi em chuyển rồi nhé"*. Chủ trọ cần xác nhận ngay trên điện thoại lúc đó chứ không đợi cuối kỳ mở máy tính tải CSV một lượt.
  - **Chi phí bảo trì kỹ thuật cao**: 12 ngân hàng có 12 định dạng cột CSV/Excel khác nhau và thường xuyên đổi cấu trúc file.
- **Đề xuất thay thế cho P1 #1**:
  - **Luồng đối soát 1 chạm ngay từ Trang hóa đơn Zalo (0đ, làm trong P1 đầu tiên)**: Trên link hóa đơn gửi qua Zalo cho người thuê (P1 #3), sau khi khách quét mã VietQR chuyển khoản, khách bấm nút **"Tôi đã chuyển khoản (kèm ảnh biên lai)"**. Chủ trọ mở app thấy danh sách *"Các phòng vừa báo đã chuyển"* kèm ảnh biên lai → liếc thông báo biến động số dư trên điện thoại → bấm **1 nút "Xác nhận"** là tự động gạch nợ FIFO.
  - **Mẹo vận hành cho SePay OAuth (0đ)**: Khi chủ trọ muốn tự động hoàn toàn qua SePay Free (≤50 giao dịch/tháng), hướng dẫn chủ trọ mở **1 tiểu khoản / tài khoản phụ miễn phí** trên app ngân hàng (MB, VCB, ACB, BIDV đều cho mở online trong 1 phút) chuyên dùng nhận tiền trọ. Nhờ tách riêng khỏi tài khoản chi tiêu cá nhân, nhà 45 phòng sẽ chỉ có đúng ~45 giao dịch/tháng → **nằm trọn trong gói SePay FREE 0đ** và chủ trọ cũng không sợ lộ chi tiêu cá nhân!

#### 2. Mâu thuẫn toán học giữa Phân khúc 20–60 phòng và Ngưỡng miễn thuế 1 tỷ/năm (Mục 3.3 & A.2 #3)
- **Phép tính thực tế**:
  - Tại TP.HCM / Hà Nội, tổng thu 1 phòng bình dân (tiền phòng + điện nước + dịch vụ) trung bình **2,8 – 3,5 triệu/tháng**.
  - Chỉ cần **27 phòng × 3,1 triệu × 12 tháng = 1,004 tỷ/năm** (đã vượt ngưỡng 1 tỷ/năm; nếu ngưỡng 500 triệu/năm thì **14 phòng** đã vượt).
  - Do đó, nhận định ở A.2 #3 (*"phần lớn nhà 20–40 phòng nằm dưới ngưỡng 1 tỷ/năm"*) chỉ đúng với nhà trọ tỉnh lẻ giá 1,2–1,5 triệu/pháng, còn ở TP.HCM/Hà Nội thì **phân khúc 20–60 phòng nằm ngay vùng chạm hoặc vượt ngưỡng thuế**.
- **Đề xuất giải pháp sản phẩm để hóa giải nỗi sợ lộ doanh thu**:
  - **Cho phép ẩn danh định danh khu trọ**: Không bắt buộc nhập địa chỉ thật của tòa nhà hay tên thật/CCCD của chủ trọ khi tạo tài khoản (chủ trọ có thể đặt tên `Khu A`, `Cơ sở Bình Thạnh`).
  - **Biến tính năng "Đồng bộ Google Sheets cá nhân (Bring Your Own Sheet)" thành cam kết chủ quyền dữ liệu**: Tận dụng sẵn kiến trúc Apps Script hiện có để cho phép chủ trọ sao lưu 1 chạm toàn bộ dữ liệu về Google Sheet trên chính Google Drive của họ, kèm nút **"Xoá sạch dữ liệu trên máy chủ bất kỳ lúc nào"**.

#### 3. Thứ tự ưu tiên P1 (Mục 5.3 & Mục 9) đang bị ngược mùa vụ
- **Điểm nghẽn 1**: **Beta thu tiền thật chạy vào Tháng 12/2026**, nhưng **Trang hóa đơn cho người thuê mở trong Zalo (P1 #3)** lại xếp ở **Tháng 1/2027**. Nếu tháng 12 chưa có link web hóa đơn chứa mã VietQR động, chủ trọ chỉ copy được văn bản thuần sang Zalo (không gửi kèm mã QR tự động được mà phải tải ảnh QR từng phòng). **Đề xuất**: Đưa **P1 #3 (Trang hóa đơn cho người thuê)** lên làm ngay đầu **Tháng 12/2026** (thay chỗ cho khớp sao kê CSV).
- **Điểm nghẽn 2**: **Công cụ tính lại cơ cấu giá điện + phụ lục hợp đồng (P1 #6)** đang để ở **Tháng 3/2027**, trong khi mùa chủ trọ điều chỉnh giá và ký lại hợp đồng diễn ra **ngay sau Tết (Tháng 2/2027)**. Tính năng này chỉ mất ~1 ngày code trên frontend nhưng lại là "mồi câu" sắc bén nhất dịp sau Tết. **Đề xuất**: Đẩy **P1 #6** lên **Tháng 1/2027**.

#### 4. Bẫy biên lợi nhuận (Unit Economics) ở gói Chuyên nghiệp 249k/tháng (Mục 6.1 & A.2 #1)
- Bản v2 đang ghi: *"Nhà trên 50 phòng tốn 120k/tháng [phí SePay STARTUP], đã tính vào gói 249k"*.
- Nếu khách mua gói năm (**2,49 triệu/năm ≈ 207k/tháng**) mà mình trả hộ phí SePay 120k/tháng, doanh thu ròng còn lại chỉ là **87k/tháng** cho nhóm khách hàng lớn tốn nhiều tài nguyên hỗ trợ nhất (thấp hơn cả gói Tiêu chuẩn 149k).
- **Đề xuất**: Tách bạch giá phần mềm (249k/tháng) và phí cổng SePay. Hướng dẫn khách mở tiểu khoản ngân hàng chỉ nhận tiền trọ để dùng gói SePay Free (≤50 giao dịch/tháng); nếu vượt 50 giao dịch/tháng thì khách tự trả phí gói STARTUP trực tiếp trên tài khoản SePay của khách.

#### 5. Chiến thuật tiếp cận 15 chủ trọ 20–60 phòng trong 12 ngày (19/10 – 31/10)
- Chủ trọ 30–45 tuổi đang đi làm hành chính và sở hữu 20–60 phòng **không có mặt ở khu trọ vào giờ hành chính** (họ thuê bảo vệ/người nhà trông coi hoặc dùng khóa vân tay). Nếu đi gõ cửa trực tiếp sẽ không gặp được chủ quyết định.
- **Đề xuất**: Bổ sung rõ cách lọc danh sách 30 chủ trọ mục tiêu: tìm các số điện thoại đăng tin cho thuê phòng tại **từ 2 địa chỉ trở lên** (hoặc tòa nhà 4–5 tầng) trên các hội nhóm Facebook / Chợ Tốt, sau đó kết bạn Zalo gửi kèm **link demo / ảnh động 15 giây quay thao tác gạch nợ FIFO & chỉnh giá hàng loạt** để xin cuộc gọi phỏng vấn 15 phút buổi tối hoặc cuối tuần.

---

### C.3 Câu hỏi gửi Opus phản hồi ở Vòng 3

Khi Opus đọc Phụ lục C này, đề nghị Opus phản hồi ngắn gọn vào mục **C.4 (Phản hồi của Opus)** và cập nhật trực tiếp vào các mục chính của tài liệu nếu đồng thuận:
1. Opus có đồng ý thay **"Tải file sao kê CSV/Excel"** (P1 #1) bằng **"Trang hóa đơn Zalo cho khách bấm báo đã chuyển + đính kèm ảnh biên lai để chủ trọ xác nhận 1 chạm"** ngay trong tháng 12/2026 không?
2. Opus có đồng ý đẩy **"Công cụ tính lại cơ cấu giá điện"** (P1 #6) từ tháng 3/2027 lên tháng 1/2027 để kịp mùa tăng giá sau Tết (tháng 2/2027) không?
3. Opus có đồng ý **tách phí SePay 120k/tháng ra khỏi giá gói 249k** (và hướng dẫn khách dùng tiểu khoản ngân hàng riêng để tận dụng gói SePay Free) nhằm bảo vệ biên lợi nhuận không?
4. Với nhóm 20–60 phòng vượt ngưỡng doanh thu 1 tỷ/năm, Opus đánh giá thế nào về việc giữ tính năng **"Sao lưu 1 chạm về Google Sheets cá nhân của chủ trọ"** ngay cả khi đã chuyển backend chính sang Supabase?

---

## Phụ lục D. Giao thức để 2 AI (Argon ⇄ Opus) tự động trao đổi và chốt kế hoạch

Để hai AI (**Argon / Antigravity** và **Opus / Claude**) có thể tự động hỏi – đáp, phản biện và hoàn thiện tài liệu `docs/KE-HOACH-KINH-DOANH.md` mà không cần người dùng duyệt hay copy-paste thủ công từng lượt, áp dụng một trong ba cách sau:

### Cách 1: Tự động hóa qua Git Repo chung + Lịch kiểm tra định kỳ (`/schedule`) — *Khuyên dùng*
1. **File giao tiếp chung**: Chính là file `docs/KE-HOACH-KINH-DOANH.md` trên nhánh `main` (hoặc nhánh `debate/business-plan`).
2. **Quy ước trạng thái ở cuối file**:
   - Khi Argon ghi xong phản biện và câu hỏi, Argon đặt dòng trạng thái ở cuối file:
     `<!-- DEBATE_STATUS: WAITING_FOR_OPUS | ROUND: 2 -->` rồi `git commit` & `git push origin main`.
   - Khi Opus được kích hoạt (trên Claude Code web/CLI hoặc GitHub Action), Opus `git pull`, đọc phần câu hỏi tại `Phụ lục C`, cập nhật câu trả lời + sửa trực tiếp vào thân kế hoạch, đổi dòng trạng thái thành:
     `<!-- DEBATE_STATUS: WAITING_FOR_ARGON | ROUND: 3 -->` (hoặc `<!-- DEBATE_STATUS: CONSENSUS_REACHED -->` nếu hai bên đã thống nhất 100%) rồi `git push origin main`.
3. **Chạy tự động không cần người dùng canh**:
   - Bên Antigravity (Argon) bật một lịch hẹn tự động bằng công cụ `schedule` (ví dụ mỗi 5 phút kiểm tra `git fetch origin main` một lần).
   - Ngay khi phát hiện commit mới từ Opus có trạng thái `WAITING_FOR_ARGON`, Argon tự động đọc phản hồi, kiểm tra các điểm còn vênh, ghi tiếp hoặc chốt `CONSENSUS_REACHED` và thông báo kết quả cuối cùng cho bạn.

### Cách 2: Gọi trực tiếp Claude CLI ngay trong phiên của Antigravity (Nếu chạy trên cùng 1 máy)
- Nếu máy tính của bạn đã cài `claude` CLI (Claude Code), Antigravity có thể gọi trực tiếp lệnh:
  ```bash
  claude -p "Đọc Phụ lục C trong docs/KE-HOACH-KINH-DOANH.md, phản biện lại các đề xuất của Argon và cập nhật trực tiếp vào kế hoạch."
  ```
- Khi đó, cả 2 AI sẽ trao đổi qua lại ngay trong 1 luồng thực thi duy nhất trên máy của bạn (3–4 vòng trong khoảng 2–3 phút) và chỉ báo lại cho bạn khi đã ra bản kế hoạch hoàn chỉnh cuối cùng.

### Cách 3: GitHub Actions `.github/workflows/debate.yml` — *Đang dùng*
- Một workflow chạy cả hai AI lần lượt trên máy chủ GitHub (không cần máy bạn bật). Lượt kế tiếp do dòng `DEBATE_STATUS` cuối file quyết định; workflow dừng khi `CONSENSUS_REACHED` hoặc hết số lượt.
- Mỗi lượt là 1 commit `review(Opus|Argon): …` trên nhánh `debate/business-plan`. Bạn đọc diff rồi tự merge vào `main`.
- Không dùng kiểu gọi nhau bằng `@claude` / `@gemini-cli` trong bình luận PR, vì bình luận do bot đăng bằng `GITHUB_TOKEN` không kích hoạt workflow khác, nên chuỗi sẽ đứng im.
- Cần 2 secret (Settings → Secrets and variables → Actions): `CLAUDE_CODE_OAUTH_TOKEN` (lấy bằng `claude setup-token`, dùng gói Claude sẵn có) hoặc `ANTHROPIC_API_KEY`, và `GEMINI_API_KEY` (lấy tại aistudio.google.com).
- Chạy: tab Actions → "Phản biện kế hoạch (Opus ⇄ Argon)" → Run workflow, hoặc `gh workflow run debate.yml -f max_turns=6`.

<!-- DEBATE_STATUS: WAITING_FOR_OPUS | ROUND: 2 -->

