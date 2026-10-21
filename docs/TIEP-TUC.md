# Việc còn dở (cập nhật 21/10/2026)

Đọc file này đầu đoạn chat mới. Mọi thứ khác đã merge vào `main`, đã deploy GitHub Pages và Apps Script `@18`.
Tình trạng đầy đủ: mục 5.0 của [KE-HOACH-KINH-DOANH.md](KE-HOACH-KINH-DOANH.md).

## 1. Migration 2 trên Supabase — XONG (21/10/2026)
- Đã chạy `supabase/migrations/20261021000000_staff_public_invoice_account.sql` trên project `ymdnvpdgdpdjnqnraklg`.
- Đã kiểm tra trên DB thật:
  - RPC `get_public_invoice` với mã sai trả `null`; `report_invoice_paid` trả `INVOICE_NOT_FOUND`; khách vô danh gọi `delete_my_account` bị chặn.
  - `supabase/tests/rls-live.sql` (dán vào SQL Editor, chạy cả file): A/B tách nhau, staff đọc + ghi, viewer chỉ đọc, hóa đơn công khai không lộ tên/SĐT, lời báo chỉ chủ trọ thấy, xoá tài khoản chỉ xoá A. Đạt thì báo lỗi cố ý `ALL RLS CHECKS PASSED` để mọi thứ rollback.
  - `https://hienphuong99.github.io/phongtro/?hd=<mã sai>` hiện "Không tìm thấy hóa đơn".

## 2. Thử với tài khoản Supabase thật
- Khóa phiên bản đã kiểm tra trên DB thật (`rls-live.sql`: bản cũ không ghi đè được bản mới, không tạo 2 sổ cho 1 chủ). Bản sao offline và xung đột trên giao diện mới có unit test, chưa chạy qua đăng nhập thật.
- Không tự tạo tài khoản: nhờ chủ dự án đăng ký 1 tài khoản (hoặc dùng tài khoản sẵn có) rồi thử: tạo sổ trống, sửa, mất mạng, mở 2 tab cùng sửa (phải báo xung đột), mở link hóa đơn người thuê, bấm "Tôi đã chuyển", chủ trọ xác nhận.

## 3. Script nhập liệu hộ đẩy lên mây
- `npm run import:beta -- file.xlsx --email chu@tro.vn` cần `SUPABASE_SERVICE_ROLE_KEY` trong `.env.local` (chủ dự án tự dán, không commit, không đặt tên `VITE_`).
- `--template`, `--dry-run` đã chạy được. Phần đẩy lên mây có test với máy chủ giả (`scripts/import-beta.test.mjs`); chỉ còn chạy thật khi có khóa.

## 4. Giao diện iOS 27 (Liquid Glass) — đã làm phần khung, còn lại
- Đã có: menu trái + thanh trên bằng kính, thanh tab nổi trong suốt kiểu ảnh mẫu (tab đang chọn là viên thuốc xanh có chữ),
  chế độ ngày/đêm (nút trên thanh web, công tắc trong Cài đặt, lưu `localStorage` `qlpt-theme`). CSS ở cuối `src/index.css`.
- Đã rà chế độ đêm mọi màn và hộp thoại (màu nền nhạt có độ trong suốt, đường kẻ SVG màu cứng), trang người thuê theo chế độ ngày/đêm của máy,
  thanh trạng thái giả trong "Khung Mobile" làm lại kiểu iOS, ảnh `docs/screenshots/` chụp lại. Lần đầu mở app cũng theo chế độ của máy.
- Bản demo thiết kế: https://claude.ai/artifact/VkYL7tLbEe67oMKaibLVHo

## 5. Chờ bên ngoài
- P1 #7 SePay OAuth: chờ SePay duyệt `client_id`.
- Việc của chủ dự án trong mục 14 kế hoạch: đổi `SYNC_TOKEN`, hỏi kế toán thuế, chọn tên thương hiệu.
