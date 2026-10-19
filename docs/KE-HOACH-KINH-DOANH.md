# Kế hoạch kinh doanh OptiRent — bản v2 (11/2026 → 10/2027)

Bản v1 lập ngày 17/10/2026. Bản v2 cập nhật ngày 18–19/10/2026, sau một bản đánh giá phản biện và đợt sửa code ngày 18–19/10. Tên hiển thị của app đã đổi từ "OptiRent" thành "Quản lý phòng trọ"; tài liệu này vẫn gọi là OptiRent cho tới khi chọn tên thương hiệu chính thức.

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
4. **Hai tuần tới không viết thêm tính năng.** Việc cần làm là triển khai bản khóa API (khoảng 15 phút), rồi mang bản demo đi gặp 15 chủ trọ. Tháng 11 chỉ làm phần nền: đăng nhập, phân quyền dữ liệu, chuyển sang database thật, kiểm thử phần tính tiền.
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

**Hai điểm bản v2 không làm theo bản đánh giá:**
- **Không làm tính năng đổi tên tiền điện thu vượt thành "phí hao hụt".** Nếu khoản phí đó thực chất vẫn là tiền điện thì vẫn vi phạm NĐ 133/2026, người thuê khiếu nại được. App sẽ giúp chủ trọ tính lại giá theo cách hợp pháp: tiền điện đúng giá cộng 10% hao hụt theo hướng dẫn EVN, cộng phí dịch vụ thật (vệ sinh, bảo trì, điện hành lang, bơm nước) có ghi trong hợp đồng và tách dòng riêng trên phiếu. Như vậy chủ trọ giữ được gần như nguyên thu nhập.
- **Không làm "tối ưu thuế" theo nghĩa giấu doanh thu.** Báo cáo doanh thu chỉ để chủ trọ tự xem hoặc tự chứng minh mình dưới ngưỡng miễn thuế. Báo cáo chỉ tạo khi chủ trọ tự bấm, và không chia sẻ cho ai.

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
| Đồng bộ Google Sheets | Gửi kèm mã `SYNC_TOKEN`, báo lỗi thật, dữ liệu web được ghi đúng cột | Sửa ngày 18–19/10, cần triển khai lại Apps Script |
| Cảnh báo | Thanh "Bản demo" ở đầu trang; cảnh báo khi giá điện > 3.460 đ/kWh | Dữ liệu mẫu vẫn để 3.500 đ/kWh để khớp video demo |

### 2.2 Còn thiếu để bán được

1. **Đăng nhập và tách dữ liệu theo chủ trọ.** Hiện cả hệ thống dùng chung một Google Sheet.
2. **Dữ liệu chỉ nằm trong trình duyệt.** Đồng bộ Sheets mới chỉ là bản sao lưu một chiều.
3. **Ngày và kỳ bị gắn cứng.** "Hôm nay" luôn là 11/10/2026. Bộ chọn kỳ chỉ có 09–11/2026, cộng thêm kỳ của hóa đơn mới tạo.
4. **Bản khóa API chưa chạy trên server.** Môi trường làm việc này không có quyền `clasp`. Bạn cần tự chạy `npm run deploy:sheets` rồi tạo mã bằng menu 🔑 trên Google Sheets (mục 9). Trước khi làm, Web App đang chạy vẫn là bản cũ, ai có link cũng đọc được dữ liệu.

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
  - Chạy `npm run deploy:sheets` để triển khai bản khóa API.
  - Mở Google Sheets → menu **🏠 Quản lý phòng trọ → 🔑 Tạo / xem mã đồng bộ**, chép mã vào trang Cài đặt của web.
  - Web lên GitHub Pages tự động khi merge vào `main` (đã merge ngày 19/10).
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

- [ ] Chạy `npm run deploy:sheets` để triển khai bản khóa API.
- [ ] Trên Google Sheets: menu 🔑 Tạo / xem mã đồng bộ, rồi dán mã vào trang Cài đặt của web.
- [ ] Thử: `.../exec?action=getState` không kèm mã phải trả về `UNAUTHORIZED`.
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
| Khách không chịu liên kết ngân hàng | Cao | Khớp sao kê là cách chính, SePay chỉ là tùy chọn |
| Hiểu sai luật | Trung bình | Cho phép cấu hình ngưỡng, ghi rõ "không phải tư vấn thuế/pháp lý" |

---

## 13. Nguồn tham khảo (đọc ngày 17–18/10/2026)

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
