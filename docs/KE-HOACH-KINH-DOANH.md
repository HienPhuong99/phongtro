# Kế hoạch kinh doanh OptiRent — 11/2026 → 10/2027

Lập ngày 17/10/2026. Phần code được review tới commit `d6e0bd6` (15:06 ngày 17/10/2026). Không có commit nào sau đó trước mốc 15:30.

Số liệu thị trường lấy từ báo chí và trang của đối thủ, đăng trong năm 2026 (danh sách nguồn ở cuối). Các văn bản luật chỉ được đọc qua báo, **chưa đối chiếu với văn bản gốc**. Chỗ nào có số liệu mâu thuẫn hoặc chưa kiểm chứng được thì có đánh dấu ⚠️.

---

## 0. Tóm tắt

1. **App hiện tại chỉ là bản demo, chưa bán được.** Giao diện và nghiệp vụ đầy đủ (8 phân hệ, FIFO, VietQR, pro-rata). Nhưng chưa có đăng nhập. Dữ liệu chỉ nằm trong `localStorage` của trình duyệt. Nút đồng bộ Google Sheets thực ra không ghi được gì. Ai có link cũng đọc được toàn bộ CCCD và SĐT khách thuê. Kỳ hóa đơn bị gắn cứng vào tháng 09–11/2026. Phải làm xong "nền móng" (mục 4.1) thì mới thu tiền khách được.
2. **Thời điểm thuận lợi: luật 2026 tạo ra nhu cầu mới.** Bốn thay đổi buộc chủ trọ phải ghi chép bài bản:
   - Bỏ thuế khoán, chuyển sang tự kê khai.
   - Phạt 20–30 triệu nếu thu tiền điện cao hơn giá bán lẻ (NĐ 133/2026, hiệu lực 25/5/2026).
   - Thông báo lưu trú theo Luật Cư trú sửa đổi (từ 1/7/2026).
   - Luật Bảo vệ dữ liệu cá nhân (từ 1/1/2026).

   Đối thủ hiện vẫn chủ yếu bán "lập hóa đơn nhanh". **Định vị đề xuất: "Quản lý trọ đúng luật 2026 — rẻ, dùng qua Zalo".**
3. **Mục tiêu thực tế sau 12 tháng: khoảng 100–150 chủ trọ trả phí, doanh thu định kỳ khoảng 12–20 triệu/tháng.** Đây là mức thu nhập phụ, chưa đủ nuôi một công ty. Để so sánh: MONA House đã hoạt động 8 năm, thuộc tập đoàn 300+ nhân sự, mà mới công bố khoảng 700 chủ trọ dùng hằng ngày.
4. **Mốc quan trọng nhất:**
   - Hạn khai thuế năm 2026 là **31/01/2027** (cần kiểm tra lại).
   - **Tết Đinh Mùi rơi vào 06/02/2027.**
   - Mùa chuyển trọ sau Tết là tháng 2–3/2027. Đầu năm 2026, lượt tìm phòng ở TP.HCM tăng 130% so với cùng kỳ.

   Sản phẩm phải chạy thật với khách trả tiền **trước 20/01/2027**.

---

## 1. Hiện trạng sản phẩm (review code tới 15:30, 17/10/2026)

### 1.1 Những gì đã có và dùng được

| Phân hệ | Đã có | Đánh giá cho mục đích kinh doanh |
|---|---|---|
| Tổng quan | Lấp đầy, thu hôm nay, lợi nhuận, 7 việc cần làm | Tốt, đúng thói quen "mở app xem hôm nay phải làm gì" |
| Lịch vận hành | Lịch ghi số, hạn thu, hết hạn hợp đồng, bảo trì | Tốt |
| Phòng | Sơ đồ theo tầng, trạng thái, thất thu phòng trống, **chỉnh giá lẻ/hàng loạt kèm đồng bộ hợp đồng + hóa đơn chưa thu** (`d030f2f`) | Tính năng chỉnh giá rất hợp mùa tăng giá sau Tết |
| Khách thuê & xe | Khách đại diện/ở cùng, CCCD, xe, xuất mẫu CT01 | CT01 dùng được. Cần cập nhật theo quy trình VNeID (mục 2.3) |
| Hợp đồng | Tạo hợp đồng, tính pro-rata kỳ đầu, thanh lý, hoàn cọc | Còn 4 lỗi trong `docs/BUGS-TODO.md` (#4, #5, #6) |
| Hóa đơn | Ghi chỉ số hàng loạt, phiếu báo VietQR, tin nhắn Zalo soạn sẵn, in | Đây là lõi giá trị. Còn lỗi chỉ số mới < cũ (#3) |
| Tài chính | Sổ thu chi, quỹ, công nợ, cọc phải trả, **thu tiền FIFO** | FIFO là điểm cộng thật, đối thủ ít nhắc tới |
| Báo cáo | Doanh thu, chi phí, lợi nhuận theo tháng, xếp hạng phòng | Đủ dùng. Thiếu báo cáo phục vụ khai thuế |
| Mobile | PWA `?mode=mobile` + app Expo (`mobile-expo/`) | Xem lỗi nghiêm trọng bên dưới |
| Hạ tầng | GitHub Pages + Apps Script + Google Sheets (miễn phí) | Đủ cho demo, chưa đủ để bán (mục 4.1) |

### 1.2 Lỗi chặn — phải sửa trước khi có khách thật

Mình đã kiểm tra từng lỗi trực tiếp trong code:

1. **Không có đăng nhập, không tách dữ liệu theo chủ trọ.** Cả hệ thống dùng chung một Google Sheet (`19mgIN7…`). Nếu cho 2 chủ trọ dùng, họ sẽ thấy dữ liệu của nhau.
2. **Lộ dữ liệu cá nhân.** `apps-script/appsscript.json` đặt `"access": "ANYONE_ANONYMOUS"`. `doGet?action=getState` trả toàn bộ bảng khách thuê (họ tên, SĐT, CCCD) cho bất kỳ ai có link. `doPost` không xác thực, nên ai cũng có thể ghi đè dữ liệu (`syncState`) hoặc reset về dữ liệu mẫu (`resetSeed`). Từ 1/1/2026, Luật BVDLCN cho phép phạt tối đa 3 tỷ đồng với hành vi vi phạm thông thường.
3. **Đồng bộ Sheets thực ra không chạy.** Web gửi `action: 'SYNC_ALL'` với dữ liệu nằm ở cấp gốc (`src/App.tsx`, `handleSyncGoogleSheets`). Nhưng `doPost` chỉ nhận `action === 'syncState'` với `payload.state`. Request lại dùng `mode: 'no-cors'` nên web không đọc được lỗi, và vẫn báo "Đã đồng bộ thành công". **Thực tế dữ liệu chỉ nằm trong trình duyệt.** Xóa cache hoặc đổi máy là mất hết.
4. **App Expo dùng dữ liệu riêng, khác cấu trúc.** `mobile-expo/App.tsx` có bộ dữ liệu cứng riêng (ví dụ `RoomItem.name`, `status: 'rented'`). Khi bấm đồng bộ, app gửi `syncState` lên **cùng** Sheet, nên ghi đè dữ liệu web bằng cấu trúc khác.
5. **Dữ liệu demo bị gắn cứng.** `Invoice.billingMonth` chỉ nhận `'2026-09' | '2026-10' | '2026-11'` (`src/types.ts`). `src/App.tsx` có 24 chỗ viết cứng `'2026-10'`. Từ tháng 12/2026 trở đi app không lập được hóa đơn đúng kỳ. Chưa có luồng "chủ trọ mới tạo nhà/phòng từ đầu".
6. **Giá điện mặc định 3.500 đ/kWh** (`src/data/seedData.ts`). Theo báo chí dẫn QĐ 1279/QĐ-BCT, giá bậc cao nhất là 3.460 đ/kWh, nên **mặc định của app đã cao hơn mức trần** ⚠️. Nếu chủ trọ dùng nguyên mặc định, app đang giúp họ vi phạm NĐ 133/2026.
7. **7 lỗi còn mở trong `docs/BUGS-TODO.md`.** Trong đó có 4 lỗi mức HIGH: đổi cơ sở vẫn hiện dữ liệu cơ sở khác, reset không hỏi xác nhận, chỉ số mới < cũ, form hợp đồng thiếu SĐT/CCCD.

---

## 2. Khách hàng: ai, hành vi ra sao, vì sao trả tiền

### 2.1 Phân khúc mục tiêu (xếp theo thứ tự ưu tiên)

| Phân khúc | Quy mô | Hành vi hiện tại | Nỗi đau chính | Sẵn sàng trả |
|---|---|---|---|---|
| **A. Chủ trọ gia đình** (ưu tiên số 1) | 8–30 phòng, 1–2 khu | Sổ tay, Excel, ghi điện bằng ảnh chụp, nhắn Zalo từng người. Thường 45–65 tuổi, hoặc con cái quản lý giúp | Mất 1–2 ngày đầu tháng để tính tiền, đối soát chuyển khoản. Khách chậm trả. Từ 2026 lo chuyện thuế và giá điện | 100–300k/tháng nếu thấy tiết kiệm thời gian rõ ràng |
| **B. Chung cư mini / CHDV** | 20–100 phòng, có nhân viên | Excel nhiều sheet, nhóm Zalo nội bộ, một số đã dùng phần mềm | Nhiều nhân viên, cần phân quyền, đối soát nhiều tài khoản. Bị siết PCCC sau các vụ cháy | 300k–1,5 triệu/tháng (mức của SmartOS, MONA) |
| C. Người quản lý thuê / "sub-lease" | Nhiều chủ nhà | Excel và Zalo | Báo cáo cho từng chủ nhà | Cao, nhưng khó phục vụ. Để năm 2 |

**Bắt đầu với phân khúc A ở 1 khu vực** (ví dụ: quanh 1–2 khu công nghiệp hoặc làng đại học ở TP.HCM, Bình Dương cũ, Thủ Đức). Lý do:
- Số lượng chủ trọ đông.
- Đối thủ ít chăm sóc trực tiếp phân khúc này.
- Họ thường giới thiệu cho nhau qua nhóm Zalo khu phố hoặc nhóm chủ trọ.

### 2.2 Hành vi cần thiết kế theo (rút từ thực tế vận hành nhà trọ)

- **Chu kỳ tháng cố định:** ghi điện nước từ mùng 1 đến mùng 5, gửi phiếu báo ngay sau đó, thu đến khoảng ngày 10. → App phải nhanh nhất ở đúng 5–10 ngày này. Các ngày khác chủ trọ gần như không mở app.
- **Zalo là kênh chính, không phải app.** Người thuê (công nhân, sinh viên) **sẽ không cài thêm app**. → Mọi thứ gửi cho người thuê phải là link web mở trực tiếp trong Zalo.
- **Chuyển khoản là chính, nhưng đối soát bằng tay** (xem sao kê, đoán ai chuyển). → Tự động xác nhận chuyển khoản (webhook ngân hàng) là thứ chủ trọ "thấy tiền" rõ nhất. MONA lấy đây làm điểm bán hàng số 1 ("báo có 5 giây").
- **Ngại nhập liệu ban đầu.** Rào cản lớn nhất không nằm ở giá mà ở việc nhập lại 20 phòng, 40 khách. → Cần nhập từ Excel, hoặc **nhập hộ** (dịch vụ có thu phí hoặc miễn phí cho khách sớm).
- **Mua theo người quen và theo nhóm.** Chủ trọ tin lời chủ trọ khác hơn quảng cáo. → Giới thiệu bạn bè (referral) và hiện diện trong nhóm Facebook/Zalo chủ trọ hiệu quả hơn chạy ads.
- **Mùa vụ:**
  - Sau Tết là mùa chuyển trọ và tăng giá (đầu 2026: tìm kiếm +130%, phòng bình dân 2–4 triệu tăng 10–20%).
  - Tháng 6–7 sinh viên trả phòng.
  - Tháng 8–9 là mùa nhập học, giá tăng lần nữa.
  - Giá thuê phổ biến tháng 10/2026: TP.HCM khoảng 2,5–6 triệu (trung bình rao khoảng 3,8 triệu, theo Nhà Tốt), Hà Nội khoảng 1,3–9 triệu.

### 2.3 Thay đổi pháp lý 2026 = lý do mới để mua (cũng là tính năng khác biệt)

| Quy định | Nội dung (theo báo chí) | Tính năng nên có |
|---|---|---|
| **Thuế cho thuê nhà 2026** | Bỏ thuế khoán, bỏ lệ phí môn bài, chuyển sang tự kê khai theo doanh thu thực. Ngưỡng miễn thuế GTGT/TNCN: ⚠️ **mâu thuẫn** giữa 500 triệu/năm (nhiều nguồn) và 1 tỷ/năm (theo NĐ 141/2026 sửa NĐ 68/2026, ngày 29/4/2026). Dưới ngưỡng vẫn phải khai. Năm 2026 khai theo nửa năm hoặc cả năm, hạn **31/01/2027**. Cơ quan thuế đối chiếu với dữ liệu cư trú và giao dịch ngân hàng | Báo cáo doanh thu cho thuê theo kỳ khai, cảnh báo khi gần ngưỡng, xuất số liệu để điền tờ khai, lưu chứng từ 5 năm |
| **NĐ 133/2026** (hiệu lực 25/5/2026) | Phạt 20–30 triệu nếu thu tiền điện cao hơn giá bán lẻ sinh hoạt, buộc hoàn trả phần thu vượt. Phạt 3–5 triệu nếu kê khai sai số người dùng điện. Cứ 4 người tính là 1 hộ để hưởng định mức | Cảnh báo khi đơn giá điện vượt mức cho phép, tính tiền điện theo bậc và định mức số người, phiếu báo ghi rõ cách tính |
| **Luật Cư trú sửa đổi** (Luật 118/2025/QH15, từ 1/7/2026) | Cơ sở lưu trú và chủ nhà phải thông báo lưu trú. Đăng ký tạm trú qua VNeID cần tài khoản mức 2 và ảnh hợp đồng thuê. Phạt 500k–1 triệu/người (NĐ 282/2025) | Danh sách "ai chưa khai báo", nhắc khi có người mới vào, xuất đúng các trường cần khai, xuất ảnh hợp đồng. **Không hứa tích hợp thẳng với VNeID** vì không có API công khai |
| **Luật BVDLCN** (từ 1/1/2026) | Chỉ thu thập dữ liệu đúng mục đích, có sự đồng ý. Phạt tối đa 3 tỷ | Chủ trọ đóng vai trò bên kiểm soát dữ liệu, mình là bên xử lý. Cần: phiếu đồng ý điện tử cho người thuê, mã hóa ảnh CCCD, xóa dữ liệu khi khách trả phòng quá X tháng, nhật ký truy cập |
| **PCCC** | Chưa thấy quy định mới riêng cho nhà trọ trong năm 2026. Vẫn áp dụng QCVN 06:2022/BXD, quy định địa phương (TP.HCM: QĐ 16/2021, lối thoát nạn thứ hai) | Danh sách kiểm tra PCCC, nhắc hạn kiểm tra bình chữa cháy. Làm ít công, nhưng tạo thiện cảm với chủ trọ |

---

## 3. Đối thủ và định vị

| Đối thủ | Giá công khai (đọc 10/2026) | Mạnh | Yếu / khe hở |
|---|---|---|---|
| **MONA House** | Thử 30 ngày; ≤5 phòng 190k, 6–10 phòng 290k, 11–20 phòng 490k, 21–50 phòng 890k/tháng; trọn đời 21,9 triệu (≤50 phòng) | Báo có tự động trong khoảng 5 giây, đối soát BIDV/VCB/MB/TCB, OCR đồng hồ, khoảng 700 chủ trọ | Đắt với nhà dưới 20 phòng. Không nhắc gì đến tuân thủ giá điện, thuế, lưu trú |
| **Quản Lý Trọ (quanlytro.me)** | Miễn phí ≤15 phòng (có quảng cáo); bản có phí không công bố giá; 50k/nhân viên thêm | Gói miễn phí rộng, có app cho khách thuê, đăng tin | Gói miễn phí gửi Zalo thủ công, có quảng cáo |
| **SmartOS** | 360k/tháng (20 phòng), 1,5 triệu/tháng (100 phòng) | Hướng tới CHDV, có booking, hợp đồng tự động | Thiên về CHDV, quá nặng với nhà trọ gia đình |
| **Room Easy (nhatro.app)** | Gói tiêu chuẩn 90k/tháng hoặc 990k/năm (3 nhà, 20 phòng) | Rẻ, có trang tra cứu hóa đơn cho khách | Không thấy có báo có tự động |
| LOZIDO, Trọ Mới Pro, Khutro… | Miễn phí tải; giá gói nâng cao chưa rõ | Gắn với kênh đăng tin tìm phòng | — |

**Định vị:** *"OptiRent — quản lý nhà trọ đúng luật 2026, gửi hóa đơn qua Zalo, tự biết ai đã chuyển khoản. Rẻ hơn một nửa so với các phần mềm lớn."*

Ba điểm khác biệt có thể bảo vệ được:
1. **Gói "Đúng luật 2026"**: tiền điện đúng bậc, báo cáo khai thuế, danh sách lưu trú, đồng ý dữ liệu cá nhân. Hiện chưa đối thủ nào bán bằng thông điệp này.
2. **Giá cho nhà dưới 30 phòng**: chưa tới một nửa giá MONA.
3. **Thu tiền FIFO, chỉnh giá hàng loạt, pro-rata**: đã có sẵn trong code.

---

## 4. Tính năng cần bổ sung (theo thứ tự ưu tiên)

### 4.1 P0 — Nền móng, bắt buộc trước khi thu tiền (tháng 11–12/2026)

| # | Hạng mục | Vì sao | Ước lượng |
|---|---|---|---|
| 1 | **Chuyển sang backend thật có đăng nhập và tách dữ liệu theo từng chủ trọ.** Đề xuất: Supabase (Postgres + Auth + Row Level Security). Đăng nhập bằng Google hoặc SĐT. Giữ Google Sheets làm tính năng **"xuất/sao lưu sang Google Sheet của tôi"** | Apps Script + một Sheet chung không làm được nhiều khách, không bảo mật, có giới hạn quota | 2–3 tuần |
| 2 | Khóa lỗ hổng Apps Script hiện tại: bỏ `getState`/`resetSeed` công khai, hoặc tắt Web App demo có dữ liệu thật | Đang lộ CCCD | 1 ngày (làm ngay) |
| 3 | Bỏ dữ liệu demo gắn cứng: kỳ hóa đơn động, ngày hiện tại thật, luồng **onboarding** (tạo nhà, tầng, phòng, đơn giá) và **nhập từ Excel/Google Sheet** | Khách thật cần bắt đầu từ dữ liệu của họ | 1–2 tuần |
| 4 | Sửa 7 lỗi trong `docs/BUGS-TODO.md` | Lỗi tính tiền làm mất niềm tin ngay tháng đầu | 3–4 ngày |
| 5 | Chọn **một** app mobile: dùng PWA (đã có) dùng chung dữ liệu với web. **Tạm dừng app Expo** cho tới khi có trên 50 khách trả phí | Hai app có hai bộ dữ liệu sẽ nhân đôi lỗi | — |
| 6 | Đơn giá điện mặc định = trống, bắt buộc nhập, cảnh báo khi vượt mức (mục 4.2) | Tránh để app khiến chủ trọ vi phạm NĐ 133/2026 | 1 ngày |
| 7 | Sao lưu tự động hằng ngày + xuất toàn bộ dữ liệu ra Excel | Chủ trọ sợ mất dữ liệu nhất | 2 ngày |
| 8 | Trang chính sách quyền riêng tư, điều khoản sử dụng, phiếu đồng ý xử lý dữ liệu cho người thuê | Luật BVDLCN; App Store và Google Play cũng bắt buộc | 2 ngày (dùng mẫu, nên nhờ luật sư rà) |

### 4.2 P1 — Tạo khác biệt và lý do trả tiền (tháng 12/2026 – 3/2027)

1. **Tự động xác nhận chuyển khoản** qua SePay hoặc Casso (webhook). Nội dung chuyển khoản chứa mã hóa đơn, khớp tiền thì gạch nợ FIFO tự động. *Đây là tính năng chủ trọ nhìn thấy giá trị rõ nhất. MONA đã có nên không thể thiếu.* ⚠️ Giá SePay/Casso năm 2026 chưa tìm được, cần hỏi trực tiếp.
2. **Trang hóa đơn cho người thuê** (link mở trong Zalo, không cần cài app): xem phiếu báo, QR, ảnh đồng hồ điện, lịch sử thanh toán, báo sự cố.
3. **Tiền điện đúng luật**: nhập giá theo hóa đơn EVN hoặc bậc giá hiện hành, số người ở mỗi phòng. App cảnh báo khi đơn giá vượt mức cho phép, và in cách tính lên phiếu báo.
4. **Báo cáo khai thuế cho thuê nhà**: tổng doanh thu theo kỳ (nửa năm/năm), so với ngưỡng (cho phép cài 500 triệu hoặc 1 tỷ cho tới khi rõ văn bản), xuất PDF/Excel để tự kê khai trên eTax Mobile hoặc gửi kế toán. *Kịp hạn 31/01/2027.*
5. **Danh sách lưu trú**: mỗi khách có trạng thái "đã khai báo VNeID / chưa", nhắc khi có người mới, xuất các trường cần khai.
6. **Ảnh đồng hồ khi ghi số** (đã có chỗ cho `meterPhoto`): bắt buộc chụp ảnh, gửi kèm phiếu báo. Giảm tranh cãi về số điện.
7. **Nhắc nợ tự động**: giai đoạn 1 vẫn dùng mẫu tin + nút mở Zalo (miễn phí). Giai đoạn 2 dùng **Zalo ZNS** như một gói bán thêm (khoảng 200–300đ/tin theo các nhà cung cấp, ⚠️ cần xác nhận với Zalo).
8. **Hợp đồng in/PDF theo mẫu**, có điều khoản tăng giá và cọc. Dùng làm ảnh hợp đồng để đăng ký tạm trú.

### 4.3 P2 — Sau khi có 50+ khách trả phí (từ tháng 4/2027)

- Nhân viên và phân quyền (cho phân khúc B).
- OCR đọc số đồng hồ.
- Đăng tin phòng trống: tạo bài đăng mẫu cho Facebook/Chợ Tốt/Zalo từ dữ liệu phòng.
- Đánh giá lại có nên làm app native (Expo) không.
- Hóa đơn điện tử/máy tính tiền cho chủ trọ doanh thu trên 1 tỷ.
- Danh sách kiểm tra PCCC, nhắc kiểm tra bình chữa cháy.

**Không làm trong năm đầu:** sàn tìm phòng, ví điện tử hoặc thu hộ tiền (cần giấy phép trung gian thanh toán), AI chatbot.

---

## 5. Mô hình doanh thu và chi phí

### 5.1 Bảng giá đề xuất (để kiểm chứng ở tháng 12–1)

| Gói | Giá | Giới hạn | Ghi chú |
|---|---|---|---|
| Miễn phí | 0đ | ≤ 5 phòng | Không có báo có tự động, không có báo cáo thuế |
| **Cơ bản** | **99k/tháng** (990k/năm) | ≤ 20 phòng | Đủ P0 + P1 trừ ZNS |
| **Tiêu chuẩn** | **199k/tháng** (1,99 triệu/năm) | ≤ 50 phòng | + nhiều khu, báo cáo nâng cao |
| Chuyên nghiệp | 399k/tháng | ≤ 100 phòng | + nhân viên (khi có P2) |
| Dịch vụ nhập liệu hộ | 200–500k/lần | — | Miễn phí cho 30 khách đầu tiên |
| Gói ZNS | Bán theo giá vốn + 30% | — | Khi có OA đã xác thực |

Cơ sở định giá:
- 20 phòng × 3,8 triệu ≈ 76 triệu tiền thuê/tháng. Phí 99k chiếm khoảng 0,13%.
- MONA thu 490k cho 11–20 phòng. Room Easy thu 90k cho 20 phòng nhưng không có báo có tự động.
- Mục tiêu khách trả trung bình khoảng 130k/tháng.

### 5.2 Chi phí cố định dự kiến (⚠️ giá dịch vụ nước ngoài quy đổi khoảng 26.000đ/USD, cần kiểm tra lại)

| Khoản | Chi phí |
|---|---|
| Supabase Pro (khi có khách thật; gói Free bị tạm dừng sau một thời gian không hoạt động) | khoảng 25 USD ≈ 650k/tháng |
| Tên miền .vn hoặc .com + email | khoảng 300–800k/năm |
| Hosting web | 0đ (GitHub Pages / Cloudflare Pages) |
| SePay/Casso | ⚠️ chưa rõ, hỏi trực tiếp |
| Google Play (một lần) / Apple Developer (theo năm) | 25 USD / 99 USD. Chỉ đăng ký khi cần lên store; giai đoạn đầu dùng PWA |
| Zalo OA xác thực + ZNS | ⚠️ hỏi Zalo; ZNS chỉ trả theo tin |
| Luật sư rà chính sách bảo mật và điều khoản | khoảng 2–5 triệu (một lần) |
| Marketing | 2–5 triệu/tháng (mục 6) |

**Tổng chi cố định khoảng 1–1,5 triệu/tháng, chưa tính marketing và công của chính bạn.** Hòa vốn tiền mặt (chưa tính công) ở khoảng 30–50 khách trả phí.

---

## 6. Kênh bán hàng (xếp theo chi phí trên mỗi khách, thấp lên cao)

1. **Gặp trực tiếp tại 1 khu vực**: đi khu trọ, dán tờ rơi có mã QR dùng thử, nói chuyện với chủ trọ. Chậm nhưng hiểu khách nhất. Mục tiêu 15 cuộc phỏng vấn trong 2 tuần đầu.
2. **Nhóm Facebook/Zalo chủ trọ** theo khu vực: đăng nội dung hữu ích, không spam quảng cáo. Ví dụ: "cách tính tiền điện đúng NĐ 133", "khai thuế cho thuê trọ trước 31/01/2027", "tăng giá phòng sau Tết sao cho đúng hợp đồng".
3. **Giới thiệu bạn bè**: mỗi chủ trọ giới thiệu thành công thì cả hai được tặng 1 tháng.
4. **Đối tác**:
   - Dịch vụ kế toán/thuế cho hộ kinh doanh: từ 2026 họ cần số liệu doanh thu của chủ trọ.
   - Môi giới phòng trọ.
   - Thợ điện nước, đơn vị PCCC.

   Hoa hồng đề xuất 20–30% năm đầu.
5. **Video ngắn TikTok/YouTube Shorts + bài SEO** cho các chủ đề luật 2026. Có hiệu quả lâu dài, chi phí chính là thời gian.
6. **Quảng cáo trả tiền** (Facebook/Zalo Ads): chỉ chạy từ tháng 3/2027, khi đã biết tỷ lệ chuyển đổi từ dùng thử sang trả phí. Ngân sách thử 2–3 triệu.

---

## 7. Kế hoạch từng tháng

Giả định: **1 người làm chính (bạn), bán thời gian khoảng 20–25 giờ/tuần, code bằng Claude Code**. Mỗi tháng có điều kiện để chuyển sang tháng tiếp theo. Không đạt thì kéo dài tháng đó, không chạy theo lịch.

### Nửa cuối tháng 10/2026 (17/10 – 31/10): Kiểm chứng nhu cầu + chặn rủi ro

- **Sản phẩm:**
  - Khóa lỗ hổng Apps Script (P0 #2).
  - Thêm cảnh báo "Bản demo — không nhập dữ liệu thật" lên bản live.
  - Sửa 4 lỗi HIGH trong `docs/BUGS-TODO.md`.
- **Khách hàng:**
  - Phỏng vấn **15 chủ trọ** (người quen, người quen giới thiệu, đi khu trọ). Dùng bộ câu hỏi ở mục 9.
  - Ghi lại: họ đang dùng gì, mất bao lâu mỗi tháng, đối soát chuyển khoản ra sao, có biết NĐ 133/thuế 2026/lưu trú không, sẵn sàng trả bao nhiêu.
- **Pháp lý:**
  - Tra cứu nhãn hiệu "OptiRent" trên cơ sở dữ liệu của Cục Sở hữu trí tuệ (WIPO Brand Database cũng được). Tên này có thể đã có người dùng ở nước ngoài. Nếu trùng thì đổi tên bây giờ, khi chi phí còn bằng 0.
  - Mua tên miền.
- **KPI:** 15 cuộc phỏng vấn, **≥ 5 chủ trọ đồng ý dùng thử bản beta** từ đầu tháng 12, ≥ 3 người nói sẵn sàng trả ≥ 99k.
- **Ngân sách:** khoảng 0,5 triệu (tên miền, cà phê phỏng vấn).
- **Điều kiện đi tiếp:** có ít nhất 5 người đồng ý dùng thử. Nếu không có, xem lại phân khúc và thông điệp trước khi code tiếp.

### Tháng 11/2026: Xây nền móng (P0)

- **Sản phẩm:**
  - Backend Supabase + đăng nhập + tách dữ liệu theo chủ trọ (P0 #1).
  - Kỳ hóa đơn động, onboarding, nhập Excel (P0 #3).
  - Sửa nốt lỗi MEDIUM/LOW trong BUGS-TODO.
  - Sao lưu, xuất Excel (P0 #7).
  - Đơn giá điện bắt buộc nhập + cảnh báo (P0 #6).
  - Chính sách bảo mật, điều khoản (P0 #8).
  - Gắn công cụ đo hành vi (Plausible/Umami tự host, hoặc PostHog bản miễn phí).
- **Khách hàng:**
  - Giữ liên lạc với nhóm beta.
  - **Nhập liệu hộ** cho 5 người beta vào cuối tháng, để đầu tháng 12 họ lập hóa đơn thật trên app.
- **Pháp lý/vận hành:**
  - Đăng ký **hộ kinh doanh** (hoặc doanh nghiệp nếu muốn gọi vốn sau này).
  - Mở tài khoản ngân hàng riêng để nhận tiền thuê bao.
  - Lưu ý: từ 2026 lệ phí môn bài đã bỏ; doanh thu dưới ngưỡng không phải nộp thuế nhưng vẫn phải khai ⚠️.
- **KPI:**
  - 100% luồng: tạo nhà → phòng → hợp đồng → ghi số → hóa đơn → thu tiền chạy trên dữ liệu trắng, không dùng dữ liệu mẫu.
  - 5 chủ trọ beta đã được nhập dữ liệu.
- **Ngân sách:** khoảng 1–3 triệu (Supabase, đăng ký kinh doanh, luật sư nếu có).
- **Điều kiện đi tiếp:** chạy được 1 chu kỳ tính tiền đầy đủ trên máy của bạn với dữ liệu thật của 1 chủ trọ.

### Tháng 12/2026: Beta thật + báo có tự động

- **Sản phẩm:**
  - Tích hợp **SePay hoặc Casso** để tự động gạch nợ (P1 #1).
  - **Trang hóa đơn cho người thuê** (P1 #2).
  - **Báo cáo khai thuế năm 2026** (P1 #4), kịp cho hạn 31/01/2027.
  - Sửa lỗi phát sinh trong kỳ thu tiền mùng 1–10/12.
- **Khách hàng:**
  - 5–10 chủ trọ beta chạy kỳ thu tiền tháng 12 trên app. **Có mặt trực tiếp hoặc gọi video** trong những ngày họ thu tiền.
  - Đo: số phút để lập hóa đơn, số lần phải gọi hỗ trợ.
  - Mở thêm 5–10 beta qua giới thiệu.
  - Đăng 4–6 bài nội dung về thuế cho thuê nhà, kỳ khai 31/01/2027 và giá điện NĐ 133 lên nhóm chủ trọ.
- **Vận hành:** tạo Zalo OA hoặc nhóm Zalo hỗ trợ; viết hướng dẫn bằng video ngắn 1–2 phút cho từng thao tác.
- **KPI:** **≥ 10 chủ trọ dùng thật trong kỳ tháng 12**, ≥ 70% hóa đơn được gửi qua app, ≥ 50% giao dịch được tự động gạch nợ (với người có liên kết ngân hàng), NPS hoặc mức hài lòng ≥ 8/10.
- **Ngân sách:** khoảng 1,5–2 triệu.
- **Điều kiện đi tiếp:** ≥ 6/10 người beta nói *"sẽ trả tiền nếu hết miễn phí"*.

### Tháng 1/2027: Bắt đầu thu tiền (trước Tết)

- **Sản phẩm:**
  - Trang bảng giá, thanh toán thuê bao (chuyển khoản VietQR + kích hoạt thủ công là đủ).
  - Hết hạn dùng thử thì về gói miễn phí, không khóa mất dữ liệu.
  - **Luồng trả phòng trước Tết**: chốt điện nước, tính ngày ở lẻ, trừ cọc, hoàn cọc (đã có một phần trong code).
  - Danh sách lưu trú (P1 #5).
- **Khách hàng:**
  - Ưu đãi **"khách sớm"**: 990k/năm gói Cơ bản, giữ giá trọn đời cho 50 khách đầu.
  - Chiến dịch "khai thuế cho thuê trọ trước 31/01" kèm báo cáo trong app.
  - Chuẩn bị nội dung "tăng giá sau Tết đúng hợp đồng" (dùng tính năng chỉnh giá hàng loạt sẵn có).
- **KPI:** **15–20 khách trả phí**, doanh thu định kỳ khoảng 1,5–2,5 triệu (nếu trả theo năm thì tiền mặt vào khoảng 10–15 triệu một lần).
- **Ngân sách:** khoảng 2 triệu (in tờ rơi, quà giới thiệu).
- **Lưu ý:** Tết là **06/02/2027**. Ngừng phát hành tính năng mới từ khoảng 25/01, chỉ sửa lỗi.

### Tháng 2/2027: Tết + mùa chuyển trọ

- **Nửa đầu tháng (Tết):** trực hỗ trợ, không phát hành tính năng mới.
- **Sau Tết:** nhu cầu tìm phòng tăng mạnh (đầu 2026 tăng 130%), nhiều hợp đồng mới và đợt tăng giá.
  - Đẩy luồng tạo hợp đồng nhanh, pro-rata, hợp đồng PDF (P1 #8).
  - Ảnh đồng hồ khi ghi số (P1 #6).
- **Khách hàng:** nội dung "tăng giá phòng đúng luật, đúng hợp đồng" và "tính tiền điện đúng bậc khi nhiều người ở". Khởi động chương trình giới thiệu bạn bè.
- **KPI:** 30 khách trả phí, tỷ lệ huỷ < 5%/tháng.
- **Ngân sách:** khoảng 2 triệu.

### Tháng 3/2027: Mở rộng có kiểm soát

- **Sản phẩm:** tiền điện theo bậc/định mức (P1 #3), nhắc nợ theo mẫu, cải thiện theo phản hồi.
- **Khách hàng:**
  - Ký 2–3 **đối tác** (văn phòng kế toán hộ kinh doanh, môi giới phòng trọ) với hoa hồng 20–30% năm đầu.
  - Thử quảng cáo Facebook/Zalo 2–3 triệu, đo chi phí mỗi lượt dùng thử và tỷ lệ chuyển sang trả phí.
- **KPI:** 45 khách trả phí, doanh thu định kỳ khoảng 5–6 triệu, chi phí có được một khách (CAC) < 300k.
- **Điều kiện đi tiếp:** nếu CAC > 3 tháng phí thì dừng ads, quay về kênh giới thiệu và đối tác.

### Tháng 4/2027: Giữ chân khách + gói bán thêm

- **Sản phẩm:**
  - Xác thực Zalo OA, gói ZNS nhắc tiền tự động (P1 #7).
  - Báo cáo tháng gửi tự động cho chủ trọ (tóm tắt tháng).
  - Bắt đầu P2: nhân viên và phân quyền.
- **Khách hàng:** gọi điện cho 100% khách có dấu hiệu bỏ (không đăng nhập trong kỳ thu tiền).
- **KPI:** 55 khách trả phí, ≥ 85% khách đăng nhập trong kỳ mùng 1–10.

### Tháng 5/2027: Phân khúc B (chung cư mini / CHDV)

- **Sản phẩm:** phân quyền nhân viên, quản lý nhiều khu, gói Tiêu chuẩn/Chuyên nghiệp.
- **Khách hàng:** tiếp cận 10 chủ CHDV hoặc chung cư mini, dùng 2–3 khách phân khúc A làm ví dụ thực tế.
- **KPI:** 65 khách trả phí, trong đó ≥ 5 khách gói ≥ 199k.

### Tháng 6/2027: Chuẩn bị mùa sinh viên trả phòng

- **Sản phẩm:**
  - Tạo nhanh bài đăng phòng trống (P2) từ dữ liệu phòng.
  - Luồng trả phòng hàng loạt.
  - Báo cáo doanh thu nửa đầu năm 2027 phục vụ kỳ khai thuế ⚠️ (kiểm tra lịch khai năm 2027).
- **KPI:** 75 khách trả phí.

### Tháng 7/2027: Kỳ khai thuế giữa năm + phòng trống

- **Khách hàng:**
  - Chiến dịch nội dung "khai thuế nửa năm" (nếu năm 2027 vẫn khai theo nửa năm; hạn năm 2026 là 31/7).
  - Chiến dịch "lấp phòng trống trước mùa nhập học".
- **Vận hành:** rà lại toàn bộ quy định đã cập nhật (thuế, điện, cư trú, BVDLCN), cập nhật tính năng nếu có thay đổi.
- **KPI:** 85 khách trả phí.

### Tháng 8/2027: Mùa nhập học (đỉnh thứ hai)

- **Sản phẩm:** hợp đồng mới hàng loạt, chỉnh giá hàng loạt, đăng tin phòng trống.
- **Khách hàng:**
  - Chiến dịch lớn nhất năm 2: tặng tháng dùng thử, đẩy mạnh giới thiệu bạn bè.
  - Có mặt ở các khu trọ quanh trường đại học.
- **KPI:** 100 khách trả phí.

### Tháng 9/2027: Ổn định và đo lường

- **Sản phẩm:** đánh giá có cần app native (Expo) không, dựa trên số liệu dùng PWA. OCR đồng hồ nếu khách yêu cầu nhiều.
- **KPI:** 110–120 khách trả phí, tỷ lệ huỷ < 4%/tháng.

### Tháng 10/2027: Tổng kết 12 tháng và quyết định hướng đi

- **Đánh giá:**
  - Doanh thu định kỳ (mục tiêu 12–20 triệu/tháng).
  - Tỷ lệ huỷ.
  - CAC và giá trị vòng đời khách (LTV).
  - Thời gian bạn bỏ ra.
- **Ba hướng:**
  1. Tiếp tục làm một mình như nguồn thu nhập phụ.
  2. Tuyển 1 người hỗ trợ/bán hàng và mở rộng sang Hà Nội hoặc tỉnh khác.
  3. Tìm đối tác chiến lược (ví dụ: sàn đăng tin phòng trọ, đơn vị kế toán).
- **Ngưỡng quyết định:** nếu tỷ lệ huỷ ≤ 3%/tháng và LTV/CAC ≥ 3 thì đáng đầu tư mở rộng.

### Bảng tổng hợp mục tiêu

| Tháng | Khách trả phí (cuối tháng) | Doanh thu định kỳ ước tính* | Mốc sản phẩm |
|---|---|---|---|
| 10/2026 | 0 | 0 | Khóa lỗ hổng, 15 phỏng vấn |
| 11/2026 | 0 (5 beta) | 0 | Nền móng P0 |
| 12/2026 | 0 (10 beta) | 0 | Báo có tự động, trang hóa đơn cho khách, báo cáo thuế |
| 01/2027 | 15–20 | khoảng 2 triệu | Thu phí, luồng trả phòng |
| 02/2027 | 30 | khoảng 3,5 triệu | Hợp đồng PDF, ảnh đồng hồ |
| 03/2027 | 45 | khoảng 5,5 triệu | Tiền điện theo bậc, đối tác |
| 04/2027 | 55 | khoảng 7 triệu | ZNS, báo cáo tháng |
| 05/2027 | 65 | khoảng 8,5 triệu | Phân quyền, phân khúc B |
| 06/2027 | 75 | khoảng 10 triệu | Đăng tin phòng trống |
| 07/2027 | 85 | khoảng 11 triệu | Cập nhật luật |
| 08/2027 | 100 | khoảng 13 triệu | Chiến dịch nhập học |
| 09/2027 | 110–120 | khoảng 15 triệu | — |
| 10/2027 | 120–150 | 15–20 triệu | Tổng kết |

\* Tính theo trung bình khoảng 130k/khách/tháng. Khách trả theo năm sẽ làm tiền mặt về sớm hơn nhưng doanh thu định kỳ không đổi.

---

## 8. Những việc cần chuẩn bị ngay (tuần này)

- [ ] Gỡ hoặc khóa endpoint `getState`/`resetSeed` công khai của Apps Script. Không nhập dữ liệu khách thật vào bản demo.
- [ ] Danh sách 30 chủ trọ có thể liên hệ (người quen, hàng xóm, nhóm Zalo khu phố) để chọn ra 15 người phỏng vấn.
- [ ] Tra cứu trùng tên "OptiRent", mua tên miền.
- [ ] Quyết định kiến trúc backend (đề xuất Supabase) trước khi code thêm tính năng.
- [ ] Đọc văn bản gốc: NĐ 141/2026 và NĐ 68/2026 (thuế), NĐ 133/2026 (điện), Luật 118/2025/QH15 + NĐ 282/2025 (cư trú), Luật BVDLCN 2025 và nghị định hướng dẫn. Nếu được, hỏi 1 kế toán thuế hộ kinh doanh để chốt **ngưỡng 500 triệu hay 1 tỷ** trước khi làm báo cáo thuế.
- [ ] Hỏi giá SePay và Casso (gói theo số giao dịch, ngân hàng hỗ trợ), hỏi giá Zalo OA xác thực + ZNS.
- [ ] Chuẩn bị 1 điện thoại/SIM và Zalo riêng cho hỗ trợ khách hàng.

---

## 9. Bộ câu hỏi phỏng vấn chủ trọ (15–20 phút)

1. Anh/chị có bao nhiêu phòng, mấy khu? Ai trực tiếp thu tiền?
2. Kể lại lần thu tiền tháng trước: từ lúc ghi điện tới lúc thu đủ mất bao lâu? Khâu nào mệt nhất?
3. Hiện ghi chép bằng gì (sổ, Excel, app nào)? Đã từng thử phần mềm nào chưa? Vì sao bỏ?
4. Khách trả bằng gì? Kiểm tra ai đã chuyển khoản bằng cách nào?
5. Đang thu tiền điện bao nhiêu một số? Đã nghe về quy định phạt khi thu điện cao hơn giá chưa?
6. Năm nay đã khai thuế cho thuê nhà chưa? Ai làm giúp?
7. Khai báo tạm trú/lưu trú cho khách thế nào?
8. Nếu có công cụ làm được [tóm tắt 3 điểm khác biệt], anh/chị có dùng thử không? Bao nhiêu tiền một tháng thì thấy hợp lý? Bao nhiêu thì quá đắt?
9. Anh/chị biết chủ trọ nào khác có thể quan tâm không?

Không bán hàng trong buổi phỏng vấn. Chỉ ghi chép. Sau 15 cuộc thì tổng hợp: 3 nỗi đau xuất hiện nhiều nhất, mức giá trung vị, kênh giới thiệu.

---

## 10. Rủi ro và cách giảm

| Rủi ro | Khả năng | Cách giảm |
|---|---|---|
| Không đủ chủ trọ chịu trả tiền (đối thủ có bản miễn phí ≤15 phòng) | Cao | Kiểm chứng ở tháng 10–12 trước khi đầu tư lớn. Bán bằng "tiết kiệm thời gian + đúng luật", không bán bằng "nhiều tính năng" |
| Lỗi tính tiền làm mất niềm tin | Trung bình | Có test tự động cho phần tính tiền, FIFO, pro-rata. Có mặt cùng khách trong kỳ thu đầu tiên |
| Lộ dữ liệu CCCD | Trung bình nếu không sửa ngay | P0 #1, #2, #8. Mã hóa ảnh CCCD, phân quyền, nhật ký truy cập |
| Hiểu sai luật (ngưỡng thuế, giá điện) | Trung bình | Cho phép cấu hình ngưỡng, ghi rõ "chỉ là công cụ hỗ trợ, không phải tư vấn thuế". Hợp tác với kế toán |
| Một người làm, kiệt sức hoặc hỗ trợ chậm | Cao | Giới hạn số beta. Có video hướng dẫn và câu hỏi thường gặp. Chỉ phát hành tính năng ngoài kỳ mùng 1–10 |
| Phụ thuộc dịch vụ ngoài (Supabase, SePay, Zalo đổi giá/chính sách) | Trung bình | Xuất dữ liệu được bất cứ lúc nào. Không khóa khách vào một ngân hàng |

---

## 11. Nguồn tham khảo (đọc ngày 17/10/2026)

**Thị trường và giá thuê**
- [Nhà Tốt — thuê phòng trọ TP.HCM, T10/2026](https://www.nhatot.com/thue-phong-tro-tp-ho-chi-minh)
- [Phongtro123 — Hà Nội, 2026](https://phongtro123.com/tinh-thanh/ha-noi)
- [Mogi — phòng trọ T10/2026](https://mogi.vn/thue-phong-tro-nha-tro)
- [CafeBiz — tìm kiếm phòng trọ TP.HCM tăng 130% đầu 2026](https://cafebiz.vn/chuyen-gi-day-phong-tro-tphcm-duoc-tim-kiem-tang-130-dau-nam-2026-thi-truong-cho-thue-soi-dong-tro-lai-176260301183439152.chn)
- [Tuổi Trẻ — vì sao giá thuê vẫn "đứng" (28/02/2026)](https://tuoitre.vn/vi-sao-tp-hcm-hut-50-nhu-cau-tim-kiem-nhung-gia-nha-cho-thue-van-dung-20260228094136624.htm)
- [Mogi — biến động giá sau Tết 2026](https://mogi.vn/news/bien-dong-gia-phong-tro-sau-tet-2026-284644/)
- [VnExpress — nhà trọ TP.HCM tăng giá trước mùa nhập học](https://vnexpress.net/nha-tro-tp-hcm-tang-gia-truoc-mua-nhap-hoc-5110826.html)

**Đối thủ**
- [MONA House — tính năng và bảng giá](https://mona.house/)
- [Quản Lý Trọ — bảng giá](https://quanlytro.me/bang-gia.html)
- [SmartOS — bảng giá](https://smartos.space/gia-phan-mem-quan-ly-nha-tro-can-ho/)
- [Room Easy](https://www.nhatro.app/)
- [LOZIDO trên App Store](https://apps.apple.com/vn/app/id1560928216)
- [Thế Giới Di Động — top phần mềm quản lý trọ](https://www.thegioididong.com/game-app/top-11-phan-mem-quan-ly-phong-tro-nha-tro-mien-phi-tot-nhat-1335391)

**Thuế**
- [ECN — HKD cho thuê phòng trọ kê khai thuế, cập nhật 7/2026 (NĐ 141/2026, ngưỡng 1 tỷ)](https://ecn.net.vn/tin-tuc/hkd-cho-thue-phong-tro-ke-khai-thue-tncn)
- [SmartOS — thuế kinh doanh nhà trọ (12/08/2026, ghi ngưỡng 500 triệu)](https://smartos.space/blog/thue-kinh-doanh-nha-tro/)
- [Thanh Niên — từ 2026 hộ cho thuê nhà nộp thuế bao nhiêu](https://thanhnien.vn/tu-2026-ho-kinh-doanh-cho-thue-nha-nop-thue-bao-nhieu-185251219163114935.htm)
- [VietnamNet — cách tính thuế cho thuê nhà từ 2026](https://vietnamnet.vn/cho-thue-nha-cach-tinh-thue-moi-tu-nam-2026-co-phai-mo-ho-kinh-doanh-2481818.html)

**Giá điện (NĐ 133/2026)**
- [VnBusiness — giá điện vượt 3.460 đồng là sai quy định (06/05/2026)](https://vnbusiness.vn/nguoi-thue-tro-chu-y-gia-dien-vuot-3460-dong-la-sai-quy-dinh.html)
- [Tuổi Trẻ — chủ trọ thu tiền điện sai sẽ bị phạt nặng (03/05/2026)](https://tuoitre.vn/chu-tro-thu-tien-dien-sai-se-bi-phat-nang-nguoi-thue-va-chu-nha-deu-co-noi-niem-rieng-20260503075052179.htm)
- [Báo Mới — siết giá điện nhà trọ](https://baomoi.com/siet-gia-dien-nha-tro-chu-tro-noi-gi-c55093517.epi)

**Cư trú và lưu trú**
- [Báo Văn Hóa — quy định lưu trú từ 1/7/2026](https://baovanhoa.vn/doi-song/chinh-thuc-tu-17-quy-dinh-moi-ve-luu-tru-qua-dem-tat-ca-nguoi-dan-can-nam-ro-242324.html)
- [LuatVietnam — đăng ký tạm trú trên VNeID](https://luatvietnam.vn/hanh-chinh/huong-dan-dang-ky-tam-tru-tren-vneid-de-tranh-bi-phat-tien-tu-15-12-2025-570-105675-article.html)
- [Thư Viện Pháp Luật — khai báo lưu trú trên VNeID 2026](https://thuvienphapluat.vn/banan/tin-tuc/cach-khai-bao-luu-tru-tren-vneid-cho-nguoi-than-o-lai-qua-dem-moi-nhat-2026-51167.html)

**Dữ liệu cá nhân**
- [The Leader — làm lộ dữ liệu cá nhân bị phạt tới 3 tỷ](https://theleader.vn/lam-lo-du-lieu-ca-nhan-nguoi-khac-bi-phat-toi-3-ty-dong-d40915.html)
- [Đại biểu Nhân dân — Luật BVDLCN](https://daibieunhandan.vn/luat-bao-ve-du-lieu-ca-nhan-nghiem-cam-hanh-vi-mua-ban-du-lieu-ca-nhan-10382040.html)

**PCCC**
- [LuatVietnam — nhà ở kết hợp kinh doanh tại TP.HCM phải có lối thoát nạn](https://luatvietnam.vn/tin-van-ban-moi/nha-o-ket-hop-kinh-doanh-phai-co-loi-thoat-nan-186-30802-article.html)
- [PLO — nhà ở kết hợp kinh doanh sẽ dừng hoạt động nếu không đảm bảo PCCC](https://plo.vn/nha-o-ket-hop-kinh-doanh-se-dung-hoat-dong-neu-khong-dam-bao-pccc-post797295.html)

**Zalo ZNS và thanh toán**
- [Bảng giá ZNS (nhà cung cấp, 2026)](https://www.smsthuonghieu.com/gia-zns/)
- [OAZNS — bảng giá ZNS](https://www.oazns.vn/bang-gia-zns/)
- [SePay — tài liệu webhook](https://developer.sepay.vn/en/sepay-webhooks)
