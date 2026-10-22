# Việc còn dở (cập nhật 22/10/2026)

Đọc file này đầu đoạn chat mới. Mọi thứ khác đã merge vào `main`, đã deploy GitHub Pages và Apps Script `@18`.
Tình trạng đầy đủ: mục 5.0 của [KE-HOACH-KINH-DOANH.md](KE-HOACH-KINH-DOANH.md).

## 1. Migration 2 trên Supabase — XONG (21/10/2026)
- Đã chạy `supabase/migrations/20261021000000_staff_public_invoice_account.sql` trên project `ymdnvpdgdpdjnqnraklg`.
- Đã kiểm tra trên DB thật:
  - RPC `get_public_invoice` với mã sai trả `null`; `report_invoice_paid` trả `INVOICE_NOT_FOUND`; khách vô danh gọi `delete_my_account` bị chặn.
  - `supabase/tests/rls-live.sql` (dán vào SQL Editor, chạy cả file): A/B tách nhau, staff đọc + ghi, viewer chỉ đọc, hóa đơn công khai không lộ tên/SĐT, lời báo chỉ chủ trọ thấy, xoá tài khoản chỉ xoá A. Đạt thì báo lỗi cố ý `ALL RLS CHECKS PASSED` để mọi thứ rollback.
  - `https://hienphuong99.github.io/phongtro/?hd=<mã sai>` hiện "Không tìm thấy hóa đơn".

## 2. Thử với tài khoản Supabase thật — XONG (22/10/2026)
- Chạy trên web thật với tài khoản thử của chủ dự án (tự đăng nhập trên Chrome):
  - Sổ trống được tạo và lưu lên mây; thêm phòng lưu lên máy chủ, chỉ thấy sổ của chính mình.
  - 2 tab cùng sửa: tab sau báo "Sổ vừa được sửa ở thiết bị khác", máy chủ giữ bản trước, "Tải bản mới nhất" tải lại và sao lưu bản trên máy.
  - Mất mạng: báo "Lưu lên mây lỗi, đang thử lại", dữ liệu giữ trên máy; có mạng lại tự lưu lên.
  - Lập hợp đồng, gửi hóa đơn Zalo tạo link `?hd=`; người thuê mở link (không lộ tên, SĐT), bấm "Tôi đã chuyển"; chủ trọ thấy lời báo, bấm Xác nhận, hóa đơn gạch đã thu, trang người thuê hiện "Chủ trọ đã xác nhận".
- Lỗi tìm ra và đã sửa: sổ mới không có nút thêm phòng/khu; mã QR luôn dùng Vietcombank; hợp đồng đầu tiên ghi phòng P202 không tồn tại.
- Hợp đồng thử lỗi HD-00001 (phòng P202) đã thanh lý bằng nút Trả phòng mới và đánh dấu đã hoàn cọc.


## 2b. Trả phòng / thanh lý hợp đồng — XONG (22/10/2026)
- Nút "Trả phòng" trên mỗi hợp đồng đang thuê (tab Hợp đồng). Chốt ngày, số điện nước, tiền phòng những ngày cuối (gợi ý theo ngày ở), khoản trừ thêm.
- Cọc trừ nợ cũ trước (FIFO), rồi hóa đơn quyết toán, rồi khoản trừ thêm; còn lại vào Tài chính → Cọc phải trả. Không ghi thêm khoản thu (cọc đã ghi thu lúc nhận).
- Hóa đơn nháp và hóa đơn chưa thu của các tháng sau ngày trả phòng bị bỏ. Phòng về Trống, khách sang Đã dọn đi.
- Logic ở `planMoveOut` (`src/utils/billing.ts`), test ở `src/utils/moveout.test.ts`. Mã hợp đồng/khách/hóa đơn giờ lấy số lớn nhất + 1 (`nextCode`).
- Đã chạy trên tài khoản thật: thanh lý HD-00001, hoàn cọc 1.563.548 đ, ghi chi "Hoàn tiền cọc".

## 3. Script nhập liệu hộ đẩy lên mây — XONG (22/10/2026)
- `.env.local` chỉ cần `SUPABASE_SERVICE_ROLE_KEY` (chủ dự án tự dán, không commit, không đặt tên `VITE_`); địa chỉ project mặc định giống web.
- Đã chạy thật: `npm run import:beta -- mau.xlsx --email hphuong123123a@gmail.com --property-id prop-an-phu` thêm khu "Nhà trọ An Phú" (2 phòng, 1 hợp đồng, 3 khách, 1 xe, nợ cũ 450.000 đ), khu cũ giữ nguyên.
- Khu đã có phòng thì script báo lỗi, không ghi đè; muốn ghi đè thêm `--replace`, muốn thêm khu mới dùng `--property-id` khác.

## 3b. Điều hướng điện thoại — XONG (22/10/2026)
- Thanh dưới: Tổng quan · Phòng · Hóa đơn · Tài chính · Thêm (mở menu các mục còn lại). Màn mở từ Thêm có nút "Quay lại".
- Mỗi lần đổi màn ghi lịch sử trình duyệt: nút Back Android / vuốt quay lại iPhone về màn trước hoặc đóng menu. Bỏ vùng vuốt mép trái (trùng cử chỉ quay lại).

## 4. Giao diện iOS 27 (Liquid Glass) — đã làm phần khung, còn lại
- Đã có: menu trái + thanh trên bằng kính, thanh tab nổi trong suốt kiểu ảnh mẫu (tab đang chọn là viên thuốc xanh có chữ),
  chế độ ngày/đêm (nút trên thanh web, công tắc trong Cài đặt, lưu `localStorage` `qlpt-theme`). CSS ở cuối `src/index.css`.
- Đã rà chế độ đêm mọi màn và hộp thoại (màu nền nhạt có độ trong suốt, đường kẻ SVG màu cứng), trang người thuê theo chế độ ngày/đêm của máy,
  thanh trạng thái giả trong "Khung Mobile" làm lại kiểu iOS, ảnh `docs/screenshots/` chụp lại. Lần đầu mở app cũng theo chế độ của máy.
- Bản demo thiết kế: https://claude.ai/artifact/VkYL7tLbEe67oMKaibLVHo

## 5. Chờ bên ngoài
- P1 #7 SePay OAuth: để sau (chủ dự án quyết định), chờ SePay duyệt `client_id`.
- Việc của chủ dự án trong mục 14 kế hoạch: đổi `SYNC_TOKEN`, hỏi kế toán thuế, chọn tên thương hiệu.
