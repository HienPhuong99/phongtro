# Kế hoạch kinh doanh OptiRent — bản v2 (11/2026 → 10/2027)

Bản v1 lập ngày 17/10/2026. Bản v2 cập nhật ngày 18–19/10/2026, sau một bản đánh giá phản biện (các vòng phản biện tóm tắt ở [AI-CHAT.md](AI-CHAT.md); bản đầy đủ Phụ lục A–J nằm trong lịch sử git, commit `86a66cc`) và đợt sửa code ngày 18–19/10. Tên hiển thị của app đã đổi từ "OptiRent" thành "Quản lý phòng trọ"; tài liệu này vẫn gọi là OptiRent cho tới khi chọn tên thương hiệu chính thức.

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
   - Tối 19/10, hai AI review chéo và sửa thêm các lỗi lộ ra khi demo: phiếu Zalo và VietQR trừ phần khách đã trả, nút "Chia sẻ" thay cho in, bỏ QR Expo trỏ IP nội bộ, ô ngày dùng bộ chọn ngày, Báo cáo và Quỹ tính từ dữ liệu thật. Phần tính tiền đã tách ra `src/utils/billing.ts` có 7 bài test (`npm test`).

   Vẫn chưa có đăng nhập, chưa tách dữ liệu theo từng chủ trọ, dữ liệu vẫn nằm trong trình duyệt.
4. **Hai tuần tới không viết thêm tính năng.** Bản khóa API Apps Script (`@13`, nay là `@15`) và Web đã triển khai xong ngày 19/10/2026; việc tiếp theo là đổi `SYNC_TOKEN` trên Google Sheets và mang bản demo đi gặp 15 chủ trọ. Tháng 11 chỉ làm phần nền: đăng nhập, phân quyền dữ liệu, chuyển sang database thật, kiểm thử phần tính tiền.
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
| Báo có tự động | SePay/Casso, giá chưa rõ | Cách chính: khách bấm "Tôi đã chuyển" trên trang hóa đơn, chủ trọ xác nhận 1 chạm (0đ). SePay OAuth là tùy chọn. Bỏ khớp file sao kê khỏi P1 | App ngân hàng trên điện thoại hầu như không xuất được CSV; liên kết ngân hàng là rào cản lớn |
| Hỗ trợ mùng 1–5 | Chưa tính | Có kế hoạch riêng (mục 7) | Hỗ trợ dồn vào đúng giờ đi làm |
| Kênh môi giới | Hoa hồng 20–30% năm đầu | Bỏ | Khoảng 300k không đủ hấp dẫn môi giới |

Bản v2 làm theo 6 điểm của bản đánh giá và phản biện 3 điểm: chi phí SePay, cách xử lý tiền điện, cách xử lý thuế. Tóm tắt các vòng phản biện ở [AI-CHAT.md](AI-CHAT.md).

---

## 2. Hiện trạng sản phẩm (19/10/2026)

### 2.1 Những gì đã có

| Phân hệ | Đã có | Ghi chú |
|---|---|---|
| Tổng quan, Lịch | Lấp đầy, thu hôm nay, lợi nhuận, việc cần làm, lịch ghi số / hạn thu / hết hạn hợp đồng | Dùng tốt để demo |
| Phòng | Sơ đồ theo tầng, chỉnh giá lẻ/hàng loạt, đồng bộ sang hợp đồng và hóa đơn chưa thu | Hợp với mùa tăng giá sau Tết |
| Khách thuê & xe | Khách đại diện/ở cùng, CCCD, xe, mẫu CT01 | — |
| Hợp đồng | Tạo hợp đồng, có ô SĐT/CCCD, kiểm tra ngày, tự sinh hóa đơn kỳ đầu theo số ngày ở | Lỗi #4–#6 đã sửa |
| Hóa đơn | Ghi chỉ số hàng loạt (chặn khi chỉ số mới < cũ), phiếu báo VietQR (đã trừ phần khách trả trước), tin Zalo soạn sẵn có link QR, nút Chia sẻ | Lỗi #3 đã sửa |
| Tài chính | Sổ thu chi, quỹ (thu trừ chi theo hình thức), công nợ, cọc phải trả, thu tiền FIFO | FIFO là điểm mạnh thật |
| Báo cáo | Thực thu (theo sổ thu chi), chi phí, lợi nhuận, xếp hạng phòng, xuất CSV | Chưa lọc được theo kỳ |
| Nhiều cơ sở | Đổi cơ sở thì mọi màn hình chỉ hiện dữ liệu cơ sở đó | Lỗi #1 đã sửa, quan trọng với phân khúc nhiều khu |
| Đồng bộ Google Sheets | Gửi kèm mã `SYNC_TOKEN`, báo lỗi thật, dữ liệu web được ghi đúng cột | Apps Script `@15` (19/10) |
| Cảnh báo | Thanh "Bản demo" ở đầu trang; cảnh báo khi giá điện > 3.460 đ/kWh | Dữ liệu mẫu vẫn để 3.500 đ/kWh |

### 2.2 Còn thiếu để bán được

1. **Đăng nhập và tách dữ liệu theo chủ trọ.** Hiện cả hệ thống dùng chung một Google Sheet.
2. **Dữ liệu chỉ nằm trong trình duyệt.** Đồng bộ Sheets mới chỉ là bản sao lưu một chiều.
3. **Ngày và kỳ bị gắn cứng.** "Hôm nay" luôn là 11/10/2026. Bộ chọn kỳ chỉ có 09–11/2026, cộng thêm kỳ của hóa đơn mới tạo.

### 2.3 Trạng thái triển khai (19/10/2026)

| Thành phần | Trạng thái | Ghi chú |
|---|---|---|
| Code trên `main` | Đã merge | Lịch sử sửa lỗi và review chéo ở [AI-CHAT.md](AI-CHAT.md) |
| Web (GitHub Pages) | **Đã triển khai** | Workflow chạy thành công ngày 19/10; https://hienphuong99.github.io/phongtro/ đang chạy bản mới |
| Apps Script Web App | **Đã triển khai (`@15`)** | Deployment `AKfycby47GcffVwe7MW4saPvL5chdA2sdswe5VzKIFIuPSfuG1RGS1Tw9wMU09UX-H8gV9ea`: `@13` (khóa API) rồi `@15` (sửa lỗi demo) ngày 19/10; đã kiểm chứng `GET ?action=getState`, `POST` sai mã trả về `UNAUTHORIZED`, và `setupSyncToken()` trên server gọi `assertSheetUi_()` ở dòng đầu |
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
| **Thuế cho thuê nhà 2026**: bỏ khoán, tự kê khai; ngưỡng miễn thuế ⚠️ 500 triệu hay 1 tỷ/năm (NĐ 141/2026) | Báo cáo doanh thu theo kỳ, chỉ tạo khi chủ trọ bấm. Không làm mồi bán hàng. Ở TP.HCM/Hà Nội, nhà 20–60 phòng thường **chạm hoặc vượt** ngưỡng, nên nỗi sợ lộ doanh thu là thật: cam kết tải dữ liệu ra và xoá sạch bất cứ lúc nào, không bắt khai địa chỉ thật hay CCCD của chủ trọ |
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
- Review chéo Opus ⇄ Argon (tin #7–#15 ở [AI-CHAT.md](AI-CHAT.md)): sửa nhóm lỗi demo, tách `billing.ts` + 8 bộ unit test (bao gồm cả quyết toán/hoàn cọc), sửa lỗi đồng bộ giá làm hóa đơn kỳ đầu thành nguyên tháng, đồng bộ điều hướng 9 phân hệ trên Mobile, script E2E báo lỗi khi không thấy nút. Viết [hướng dẫn sử dụng](HUONG-DAN-SU-DUNG.md).

### 5.2 P0: tháng 11/2026 (chỉ phần nền)

| # | Hạng mục | Ước lượng |
|---|---|---|
| 1 | Supabase: schema Postgres + Auth (đăng nhập Google hoặc email) + Row Level Security theo `owner_id`. Viết test cho RLS: tài khoản A không đọc được dữ liệu B | 1,5–2 tuần |
| 2 | Chuyển đọc/ghi từ `localStorage` sang Supabase: trạng thái đang tải, báo lỗi, không mất dữ liệu khi mạng chập chờn | 1–1,5 tuần |
| 3 | Kiểm thử tự động cho phần tính tiền. **Đã hoàn thành sớm 100% ngày 19/10**: `src/utils/billing.ts` + 8 bộ test bằng `node --test` (FIFO, kỳ đầu theo ngày ở, điện nước, số phải trả, chỉnh giá, quyết toán & hoàn cọc) | Đã xong (0 ngày) |
| 4 | "Hôm nay" theo ngày thật, kỳ hóa đơn sinh theo tháng (gỡ các chỗ gắn cứng `'2026-10'`) | 2–3 ngày |
| 5 | Script nhập liệu hộ chạy trên máy của bạn: nhận file Excel hoặc ảnh sổ qua Zalo, đẩy thẳng vào Supabase. **Không làm giao diện nhập Excel trên web** | 2 ngày |

**Không làm trong tháng 11:** giao diện onboarding đầy đủ, nhập Excel trên web, báo có tự động, app native.

### 5.3 P1: tháng 12/2026 – 3/2027

1. **Trang hóa đơn cho người thuê + xác nhận 1 chạm (code giữa tháng 12, chạy từ kỳ tháng 1).** Link mở trong Zalo (mã ngẫu nhiên khó đoán, chỉ hiện đúng hóa đơn đó, không hiện CCCD): phiếu báo, VietQR có mã hóa đơn, ảnh đồng hồ, lịch sử trả tiền, nút **"Tôi đã chuyển"** (kèm số tiền thực chuyển và ô tùy chọn ghi chú tên người chuyển hộ khi nhờ người thân chuyển khoản, tối đa 40 ký tự, hiển thị dạng văn bản thuần vì do người lạ nhập trên link công khai, giới hạn số lần bấm mỗi hóa đơn — **không tải ảnh biên lai**). Chủ trọ thấy danh sách "phòng vừa báo đã chuyển", đối chiếu thông báo biến động số dư của chính họ rồi bấm **Xác nhận**, app gạch nợ FIFO. Chủ trọ vẫn gạch được cho phòng không bấm báo. **"Tôi đã chuyển" chỉ là lời báo, không tự gạch nợ** (chống ảnh chuyển khoản giả và tránh lưu trữ dữ liệu cá nhân thừa).
2. **Tự sửa/huỷ hóa đơn, gửi lại phiếu** mà không cần gọi hỗ trợ (code trong tháng 12, giảm tải mùng 1–5 từ kỳ tháng 1).
3. **Công cụ tính lại cơ cấu giá điện + phụ lục hợp đồng** (mục 3.3), **tháng 1** (ước lượng 2–3 ngày kèm test) để kịp mùa tăng giá và ký lại hợp đồng sau Tết.
4. **Chủ quyền dữ liệu (tháng 1):** tải toàn bộ dữ liệu ra file Excel (`.xlsx`), xoá tài khoản và toàn bộ dữ liệu trên máy chủ. Luật BVDLCN cũng bắt buộc có. Chưa làm đồng bộ Google Sheets OAuth cho từng chủ trọ trừ khi phỏng vấn có nhu cầu rõ rệt.
5. **Tổng quan nhiều khu (tháng 3):** một màn hình xem tất cả khu (đã thu / còn nợ / phòng trống). Đổi khu từng màn hình đã có sẵn.
6. **Tài khoản phụ cho người nhà hoặc người quản lý (tháng 3):** chỉ ghi số và thu tiền, không xem báo cáo lợi nhuận.
7. **SePay OAuth** (sau khi SePay duyệt `client_id`): chủ trọ tự có tài khoản SePay, **tự trả phí SePay** nếu vượt gói FREE 50 giao dịch/tháng. Khuyên chủ trọ dùng một tài khoản ngân hàng riêng chỉ nhận tiền trọ để nằm trong gói FREE (nhà dưới ~40 phòng). Chỉ bật cho người tự nguyện.

Đã bỏ khỏi P1: khớp file sao kê CSV/Excel (app ngân hàng trên điện thoại hầu như không xuất được, mỗi ngân hàng một định dạng). Chỉ làm lại nếu phỏng vấn cho thấy chủ trọ quen tải sao kê trên máy tính.

### 5.4 P2: từ tháng 4/2027, khi có trên 40 khách trả phí

- Đăng tin phòng trống từ dữ liệu phòng.
- Nhắc nợ qua Zalo ZNS (khoảng 200–300đ/tin ⚠️).
- Danh sách lưu trú.
- Báo cáo doanh thu theo kỳ khai thuế.
- OCR đồng hồ.

**Không làm năm đầu:** app native trên store, sàn tìm phòng, thu hộ tiền (cần giấy phép), AI chatbot. Thư mục `mobile-expo/` **đóng băng**: không sửa thêm, không dùng khi phỏng vấn; bản di động là Web `?mode=mobile`.

---

## 6. Doanh thu và chi phí

### 6.1 Bảng giá đề xuất (kiểm chứng khi phỏng vấn và lúc mở beta)

| Gói | Giá | Giới hạn | Ghi chú |
|---|---|---|---|
| Miễn phí | 0đ | ≤ 10 phòng, 1 khu | Không có tài khoản phụ, không có SePay |
| **Tiêu chuẩn** | **149k/tháng** (1,49 triệu/năm) | ≤ 30 phòng, 3 khu | Đầy đủ P1 |
| **Chuyên nghiệp** | **249k/tháng** (2,49 triệu/năm) | ≤ 60 phòng, không giới hạn khu | + tài khoản phụ, SePay OAuth (phí SePay nếu vượt 50 giao dịch do chủ trọ tự trả cho SePay, **không** gộp vào giá) |
| Trên 60 phòng | Từ 399k/tháng | Thỏa thuận | — |
| Nhập liệu hộ | Miễn phí cho 30 khách đầu, sau đó 300–500k/lần | — | Cũng là cách hiểu các trường hợp đặc biệt |

Ước tính trung bình khoảng 180k/khách/tháng (phần lớn ở gói 149k, một phần ở gói 249k).

### 6.2 Chi phí cố định (⚠️ quy đổi khoảng 26.000đ/USD, cần kiểm tra lại)

| Khoản | Chi phí |
|---|---|
| Supabase Pro (khi có khách thật) | khoảng 25 USD ≈ 650k/tháng |
| Tên miền + email | khoảng 300–800k/năm |
| Hosting web | 0đ |
| Xác nhận chuyển khoản 1 chạm | 0đ |
| SePay | 0đ với mình: chủ trọ dùng tài khoản SePay của chính họ (FREE ≤50 giao dịch/tháng; vượt thì họ tự trả gói STARTUP từ 120k/tháng) |
| Luật sư rà chính sách bảo mật và điều khoản | khoảng 2–5 triệu (một lần) |
| Marketing | 1–3 triệu/tháng (chủ yếu in ấn, quà giới thiệu) |

**Tổng chi cố định khoảng 1,7–3,7 triệu/tháng khi đã có khách thật** (Supabase khoảng 650k + tên miền khoảng 25–70k + marketing 1–3 triệu; luật sư là chi một lần), chưa tính công của bạn. Trước đó dùng gói Supabase miễn phí thì chủ yếu chỉ có tiền marketing. **Hòa vốn tiền mặt ở khoảng 10–20 khách trả phí** (180k/khách).

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
  - Triển khai Apps Script: đã xong (`@13` ngày 19/10, `@15` sau đợt sửa lỗi demo).
  - Đổi mã: xoá `SYNC_TOKEN` trong Script Properties → menu **🏠 Quản lý phòng trọ → 🔑 Tạo / xem mã đồng bộ** → chép mã vào trang Cài đặt của web.
  - Thử lại: mở `.../exec?action=getState` không kèm mã phải bị từ chối.
- **Phỏng vấn 15 chủ trọ** đúng phân khúc mới, dùng bản demo đang chạy (bộ câu hỏi ở mục 11).
  - Cách tìm: lọc số điện thoại đăng tin cho thuê ở **từ 2 địa chỉ trở lên** hoặc tòa 4–5 tầng (nhóm Facebook, Chợ Tốt). Kết bạn Zalo, giới thiệu thật tên mình, gửi kèm clip 15 giây thao tác gạch nợ FIFO và chỉnh giá hàng loạt, xin gọi 15 phút buổi tối hoặc cuối tuần. Chủ trọ nhóm này thường không có mặt ở khu trọ giờ hành chính.
  - Chỉ nhắn tay từng người, không gom số điện thoại thành danh sách để nhắn hàng loạt (Luật BVDLCN).
  - Ở câu về giá điện và thuế: **quan sát thái độ**. Họ lo và muốn làm đúng, hay tìm cách né?
  - Ghi lại nguyên văn họ mô tả đầu tháng của mình.
- **Hỏi SePay:** nhắn bộ phận hỗ trợ: *"Tôi làm phần mềm quản lý trọ cho khoảng 50 chủ nhà, mỗi người một tài khoản ngân hàng. Điều kiện cấp OAuth client và chi phí thế nào?"* Hỏi Casso câu tương tự.
- **Pháp lý:** chọn tên thương hiệu ("Quản lý phòng trọ" là tên chung, không đăng ký nhãn hiệu được), tra trùng (Cục SHTT, WIPO), mua tên miền.
- **KPI:** 15 cuộc phỏng vấn; ≥ 5 người đồng ý dùng thử từ tháng 12; ≥ 3 người nói trả được ≥ 149k.
- **Điều kiện đi tiếp (ngày 31/10):**
  - **Bắt đầu P0 ngày 01/11** nếu đã phỏng vấn **≥ 8 người** và có **≥ 3 chủ trọ (≥ 20 phòng) đồng ý gửi sổ dùng thử Beta tháng 12**. Chưa đủ 15 cuộc thì phỏng vấn nốt vào buổi tối trong 2 tuần đầu tháng 11.
  - **Các trường hợp còn lại** (dưới 8 cuộc, hoặc mới 0–2 người đồng ý dùng thử) → chưa code P0, phỏng vấn tiếp tới **15/11** rồi xét lại đúng điều kiện trên. Tới 15/11 vẫn không đạt → xem lại định vị và nỗi đau giả định trước khi viết code.

### Tháng 11/2026: Làm phần nền (P0)

- **Sản phẩm:** 5 hạng mục P0 (mục 5.2), hoàn tất trước ngày đóng băng **25/11**, không làm gì thêm.
- **Khách hàng:** nhận file hoặc ảnh sổ của 3–5 người beta, nhập hộ bằng script vào cuối tháng (25–30/11).
- **Pháp lý:** đăng ký hộ kinh doanh (lệ phí môn bài đã bỏ từ 2026), mở tài khoản ngân hàng riêng, soạn chính sách bảo mật và điều khoản.
- **KPI:**
  - Test RLS qua (tài khoản A không đọc được dữ liệu B).
  - Test tính tiền qua.
  - Chạy được 1 chu kỳ đầy đủ trên dữ liệu thật của 1 chủ trọ.
- **Ngân sách:** khoảng 1–3 triệu.
- **Mốc kiểm tra 15/11:** cộng ước lượng 4 hạng mục P0 còn lại (mục 5.2, sau khi P0 #3 đã xong 100%) ra khoảng 3,5–4,5 tuần, vẫn sát nút với quỹ 3,5 tuần trước 25/11, nên Beta kỳ tháng 12 là **trường hợp tốt nhất**, không phải mặc định. Ngày 15/11 mà P0 #1 (Supabase + RLS có test) chưa xong → báo ngay cho chủ trọ beta là bắt đầu từ kỳ tháng 1, không đợi tới 25/11 mới báo.
- **Nếu trễ mốc 25/11:** dời kỳ thu tiền beta đầu tiên sang kỳ tháng 1/2027. Không cắt phần test.

### Tháng 12/2026: Beta kỳ 1 + Phát triển P1 (#1, #2)

- **Giai đoạn 01–10/12 (Kỳ thu tiền Beta 1):**
  - 3–5 chủ trọ chạy kỳ thu tiền tháng 12 bằng **bộ tính năng đã sẵn có từ P0** (ghi chỉ số hàng loạt, xuất phiếu VietQR dạng ảnh + tin Zalo soạn sẵn, chủ trọ bấm Thu nợ FIFO trên app). Không nhồi code trang hóa đơn mới vào trước ngày 01/12 để tránh vỡ tiến độ P0.
  - Có mặt trực tiếp hoặc gọi video ngày họ chốt sổ.
  - Đo: số phút chốt sổ 30 phòng, các trường hợp đặc biệt phát sinh thực tế, số lần phải gọi hỗ trợ.
- **Giai đoạn 06–24/12 (Phát triển & phát hành trước ngày đóng băng 25/12):**
  - Làm **trang hóa đơn cho người thuê + nút "Tôi đã chuyển" + xác nhận 1 chạm (P1 #1)** và **tự sửa/huỷ hóa đơn (P1 #2)** để sẵn sàng cho kỳ thu tiền đầu tháng 1/2027.
- **Vận hành:** nhóm Zalo hỗ trợ; quy tắc không phát hành bản mới từ 25 tới mùng 5 bắt đầu áp dụng.
- **KPI:** kỳ 01–10/12 chốt sổ ≤ 15 phút cho 30 phòng, mức hài lòng ≥ 8/10; trước 25/12 phát hành xong P1 #1 và P1 #2.

### Tháng 1/2027: Beta mở rộng (kỳ 2) + Công cụ giá điện + Bán trước

- **Giai đoạn 01–10/01/2027 (Kỳ thu tiền Beta 2):**
  - Mở thêm tới 5–10 chủ trọ beta chạy kỳ thu tiền tháng 1 với **trang hóa đơn Zalo + xác nhận 1 chạm (P1 #1)** và **tự sửa/huỷ hóa đơn (P1 #2)**.
  - Đo: tỷ lệ người thuê bấm "Tôi đã chuyển", tỷ lệ hóa đơn được gạch nợ bằng 1 chạm (mục tiêu ≥ 80%).
- **Giai đoạn 06–24/01/2027 (Hoàn tất trước ngày đóng băng Tết 25/01):**
  - Làm **công cụ tính lại giá điện + phụ lục hợp đồng (P1 #3, 2–3 ngày kèm test)**, **tải dữ liệu ra Excel và xoá dữ liệu (P1 #4)**, và luồng trả phòng trước Tết.
  - **Bán trước gói năm** cho người beta với giá ưu đãi (ví dụ 1,2 triệu/năm cho gói Tiêu chuẩn, giữ giá trọn đời). Có từ 3 người trả trước trở lên là tín hiệu thật.
- **KPI:** 5–10 người dùng kỳ tháng 1; ≥ 80% hóa đơn gạch nợ 1 chạm; ≥ 3 người trả trước gói năm.

### Tháng 2/2027: Tết + mở bán

- **Nửa đầu tháng:** trực hỗ trợ.
- **Sau Tết (mùa chuyển trọ):**
  - Mở bán chính thức với bảng giá ở mục 6.1.
  - Nội dung "tăng giá sau Tết đúng hợp đồng" (dùng chỉnh giá hàng loạt có sẵn và công cụ tính lại giá điện làm xong từ tháng 1).
- **KPI:** 10 khách trả phí.

### Tháng 3/2027

- **Sản phẩm:** tổng quan nhiều khu (P1 #5), tài khoản phụ cho người nhà/quản lý (P1 #6).
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
| 12/2026 | 0 (3–5 beta) | 0 | Trang hóa đơn cho khách + xác nhận 1 chạm, tự sửa hóa đơn |
| 01/2027 | 0 (≥3 trả trước gói năm) | 0 | Tính lại giá điện, tải/xoá dữ liệu |
| 02/2027 | 10 | khoảng 1,8 triệu | Mở bán sau Tết |
| 03/2027 | 20 | khoảng 3,6 triệu | Tổng quan nhiều khu, tài khoản phụ |
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
- [x] Sửa các lỗi demo trước buổi phỏng vấn đầu tiên (nhóm A + B, [AI-CHAT.md](AI-CHAT.md) #10–#13), triển khai Web và Apps Script `@15` (19/10).
- [ ] Đọc [hướng dẫn sử dụng](HUONG-DAN-SU-DUNG.md) và tập đi một vòng demo (mục 9 của hướng dẫn) trước buổi phỏng vấn đầu tiên.
- [ ] Tạo project Supabase (Singapore) trước 01/11. Chỉ `anon key` được nằm trong code web; `service_role key` chỉ để ở máy bạn cho script nhập liệu, không đặt tên bắt đầu bằng `VITE_`.

---

## 11. Bộ câu hỏi phỏng vấn (15–20 phút)

1. Anh/chị quản lý bao nhiêu phòng, mấy khu? Ai trực tiếp thu tiền? Anh/chị có đi làm không?
2. Kể lại đầu tháng trước: từ lúc ghi điện tới lúc thu đủ mất bao lâu? Khâu nào mệt nhất?
3. Có khách nào trả thiếu, trả gộp nhiều tháng, hoặc ghi nội dung chuyển khoản sai không? Xử lý thế nào?
4. Đang ghi chép bằng gì? Đã thử phần mềm nào chưa, vì sao bỏ?
5. Đang thu tiền điện bao nhiêu một số? Có biết quy định mới về giá điện cho thuê trọ không? *(Quan sát: lo lắng, muốn làm đúng, hay né?)*
6. Năm nay khai thuế cho thuê nhà thế nào? *(Quan sát: có ngại cho người khác thấy doanh thu không?)*
7. Nếu dùng app, anh/chị có ngại để dữ liệu phòng, tiền thuê lên đó không? Cần gì để yên tâm? *(Nếu họ chưa nhắc: có nút tải hết dữ liệu ra Excel và xoá sạch trên máy chủ thì có yên tâm hơn không? Muốn bản sao nằm ở Google Sheets của chính mình không?)*
8. Nếu có công cụ chốt sổ trong vài phút và tự gạch nợ khi khách chuyển khoản, bao nhiêu tiền một tháng thì hợp lý? Bao nhiêu thì quá đắt?
9. Anh/chị có thể gửi file Excel hoặc ảnh sổ để mình nhập hộ dùng thử từ tháng 12 không?
10. Anh/chị biết chủ trọ nào khác có thể quan tâm không?

Không bán hàng trong buổi phỏng vấn. Sau 15 cuộc thì tổng hợp: 3 nỗi đau nhiều nhất, thái độ với luật điện/thuế, mức giá trung vị, mức độ ngại về dữ liệu.

---

## 12. Rủi ro

| Rủi ro | Khả năng | Cách giảm |
|---|---|---|
| Phỏng vấn cho thấy nhóm 20–60 phòng cũng không đủ đau để trả tiền | Trung bình | Dừng code, đổi phân khúc (ví dụ CHDV) trước tháng 11 |
| Tháng 11 trễ | Cao | Đã cắt phạm vi; mốc kiểm tra 15/11 (mục 9); nếu trễ thì dời beta sang tháng 1, không cắt test |
| Lỗi tính tiền | Trung bình | Test tự động cho phần tiền; có mặt cùng khách ở kỳ đầu |
| Lộ dữ liệu | Trung bình | RLS có test, mã hóa ảnh CCCD, triển khai bản khóa API ngay |
| Quá tải hỗ trợ mùng 1–5 | Cao | Mục 7: giới hạn khách, không phát hành bản mới, cho khách tự xử lý |
| Khách không chịu liên kết ngân hàng | Cao | Xác nhận 1 chạm là cách chính, SePay chỉ là tùy chọn |
| Người thuê báo "đã chuyển" bằng ảnh giả | Trung bình | Chỉ gạch nợ khi chủ trọ bấm xác nhận theo thông báo ngân hàng của chính họ; không lưu ảnh biên lai |
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

## 14. Khúc mắc & Quyết định cần Chủ dự án giải quyết trực tiếp

Để không chặn tiến độ phỏng vấn khách hàng (19–31/10) và phát triển P0 (tháng 11), dưới đây là các việc chỉ Chủ dự án mới quyết định hoặc thao tác được:

| # | Khúc mắc / Việc cần giải quyết | Cách thực hiện cụ thể | Ảnh hưởng tới sản phẩm & code |
|---|---|---|---|
| **1** | **Đổi mã bí mật `SYNC_TOKEN` trên Google Sheets** *(Ưu tiên làm ngay)* | 1. Mở trình soạn thảo Apps Script → *Project Settings (⚙️) → Script Properties* → Xoá dòng `SYNC_TOKEN` cũ (nếu có).<br>2. Mở file Google Sheets → bấm menu **🏠 Quản lý phòng trọ → 🔑 Tạo / xem mã đồng bộ (SYNC_TOKEN)**.<br>3. Copy mã mới dán vào Web App (*Cài đặt → Kết nối & Đồng bộ Google Sheets → Mã đồng bộ*). | Khóa hoàn toàn khả năng mã cũ (trước bản vá `@13`) bị dùng lại để đọc/ghi dữ liệu trên Google Sheets. |
| **2** | **Chốt quy định Thuế cho thuê nhà 2026–2027 với Kế toán thuế** | Hỏi 1 kế toán chuyên hộ kinh doanh 2 câu:<br>*(a)* Ngưỡng doanh thu miễn thuế năm 2026–2027 chính thức là **500 triệu/năm** hay **1 tỷ/năm** (NĐ 141/2026)?<br>*(b)* Tiền điện, nước, rác **thu hộ** đúng hóa đơn nhà cung cấp có bị cộng vào doanh thu tính thuế 10% (5% GTGT + 5% TNCN) không nếu tách riêng trên hợp đồng và phiếu thu? | Quyết định công thức tính ở màn hình **Báo cáo doanh thu** và mẫu **Phụ lục cơ cấu giá điện & dịch vụ** (P1 #3). |
| **3** | **Xác nhận cơ chế đếm giao dịch & OAuth với SePay / Casso** | Nhắn bộ phận hỗ trợ SePay:<br>*(a)* Gói FREE (50 giao dịch/tháng) đếm **tổng giao dịch tiền vào + tiền ra** hay chỉ đếm **giao dịch tiền vào**?<br>*(b)* Điều kiện duyệt `client_id` OAuth 2.0 cho phần mềm nhiều chủ nhà có bắt buộc phải có Giấy phép HKD ngay không? | Xác định giới hạn phòng thực tế của gói SePay FREE và thời điểm nộp hồ sơ xin `client_id` (trước hay sau khi đăng ký HKD tháng 11). |
| **4** | **Chốt Tên thương hiệu & Mua tên miền** | Chọn 1 tên thương hiệu riêng (ví dụ: *TroNhanh, SoTro, NhaTroPro, AnTamTro...* vì *"Quản lý phòng trọ"* là tên chung không bảo hộ nhãn hiệu được, còn *"OptiRent"* dễ trùng), tra cứu trên Cục SHTT (`ipvietnam.gov.vn`) và mua tên miền `.vn` / `.com`. | Đồng bộ tên thương hiệu, logo và URL chia sẻ phiếu báo Zalo trước khi gửi link cho người thuê ở kỳ Beta. |
| **5** | **Khởi tạo Project Supabase (Trước ngày 01/11/2026)** | Tạo tài khoản Supabase (gói Free dùng cho tháng 11–12), tạo project tại region Singapore (`ap-southeast-1`) và lưu `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` vào `.env.local` (không commit). **Lưu ý bảo mật:** `SUPABASE_SERVICE_ROLE_KEY` bỏ qua mọi RLS nên tuyệt đối không đặt tên bắt đầu bằng `VITE_`; code web chỉ dùng `anon key`. | Cần thiết để bắt đầu P0 #1 (Schema Postgres + Auth + RLS) đúng ngày 01/11/2026. |
| **6** | **Thư mục `mobile-expo/`** *(Tùy chọn)* | Chọn **đóng băng** (giữ nguyên thư mục làm tài liệu tham khảo) hoặc **xoá hẳn** khỏi repo để bớt 1.574 dòng code trùng lặp. | Hai AI đã thống nhất không đồng bộ tính năng mới sang `mobile-expo/` và gỡ QR LAN `exp://192.168.0.23:8081` khỏi Web để người xem demo chỉ quét QR Mobile PWA (`?mode=mobile`). |

---

> 💬 **Hộp thư trao đổi & Kiểm tra chéo giữa hai AI (Argon ⇄ Opus)**: Toàn bộ tin nhắn trao đổi, danh sách lỗi phát hiện khi đọc chéo code và phân công sửa lỗi được thực hiện tại file riêng **[docs/AI-CHAT.md](AI-CHAT.md)**.
