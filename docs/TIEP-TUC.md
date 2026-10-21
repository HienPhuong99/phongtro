# Việc còn dở (cập nhật 21/10/2026)

Đọc file này đầu đoạn chat mới. Mọi thứ khác đã merge vào `main`, đã deploy GitHub Pages và Apps Script `@18`.
Tình trạng đầy đủ: mục 5.0 của [KE-HOACH-KINH-DOANH.md](KE-HOACH-KINH-DOANH.md).

## 1. Chạy migration 2 trên Supabase (làm đầu tiên)
- File: `supabase/migrations/20261021000000_staff_public_invoice_account.sql` (chạy lại nhiều lần vẫn an toàn).
- Project `ymdnvpdgdpdjnqnraklg`. Người dùng đã đăng nhập GitHub và Claude in Chrome trên Chrome thật:
  dùng Chrome mở `https://supabase.com/dashboard/project/ymdnvpdgdpdjnqnraklg/sql/new`, dán file, Run.
- Kiểm tra sau khi chạy:
  - `curl` RPC `get_public_invoice` với mã sai trả `null` (không phải lỗi 404 `PGRST202`).
  - Trong SQL Editor chạy bài test RLS trong `begin; … rollback;` (tạo user giả trong `auth.users`, `set local role authenticated`, `set local request.jwt.claims`), theo kịch bản của `supabase/tests/rls.test.mjs`.
  - Mở `https://hienphuong99.github.io/phongtro/?hd=<mã sai>` phải hiện "Không tìm thấy hóa đơn".
- Chưa chạy thì: trang hóa đơn người thuê, tài khoản phụ, xoá tài khoản báo lỗi; phần còn lại vẫn chạy.

## 2. Thử với tài khoản Supabase thật
- Phần lưu lên mây (khóa phiên bản, bản sao offline, xung đột) mới có unit test, chưa chạy với tài khoản thật.
- Không tự tạo tài khoản: nhờ chủ dự án đăng ký 1 tài khoản (hoặc dùng tài khoản sẵn có) rồi thử: tạo sổ trống, sửa, mất mạng, mở 2 tab cùng sửa (phải báo xung đột), mở link hóa đơn người thuê, bấm "Tôi đã chuyển", chủ trọ xác nhận.

## 3. Script nhập liệu hộ đẩy lên mây
- `npm run import:beta -- file.xlsx --email chu@tro.vn` cần `SUPABASE_SERVICE_ROLE_KEY` trong `.env.local` (chủ dự án tự dán, không commit, không đặt tên `VITE_`).
- `--template`, `--dry-run` đã chạy được.

## 4. Giao diện iOS 27 (Liquid Glass) — đã làm phần khung, còn lại
- Đã có: menu trái + thanh trên bằng kính, thanh tab nổi trong suốt kiểu ảnh mẫu (tab đang chọn là viên thuốc xanh có chữ),
  chế độ ngày/đêm (nút trên thanh web, công tắc trong Cài đặt, lưu `localStorage` `qlpt-theme`). CSS ở cuối `src/index.css`.
- Còn lại: rà từng màn ở chế độ đêm (ảnh minh họa, biểu đồ SVG màu cứng, hộp thoại trong `Modals.tsx`), trang người thuê
  `PublicInvoicePage.tsx` chưa theo theme, thanh trạng thái giả trong "Khung Mobile", chạy lại `npm run test:e2e` và chụp lại ảnh.
- Bản demo thiết kế: https://claude.ai/artifact/VkYL7tLbEe67oMKaibLVHo

## 5. Chờ bên ngoài
- P1 #7 SePay OAuth: chờ SePay duyệt `client_id`.
- Việc của chủ dự án trong mục 14 kế hoạch: đổi `SYNC_TOKEN`, hỏi kế toán thuế, chọn tên thương hiệu.
