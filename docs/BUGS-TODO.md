# Lỗi tồn đọng — chờ agent sửa

Nguồn: dogfood bản live https://hienphuong99.github.io/phongtro/ bằng skill `agent-browser-dogfood` (17/10/2026).
Báo cáo đầy đủ kèm ảnh: `dogfood-output/report.md` (thư mục bị gitignore, chỉ có trên máy đã chạy test).

Cách làm: sửa từng mục, đánh dấu `[x]`, test lại bằng `npm run build` + mở app thử đúng các bước tái hiện, rồi commit/merge/deploy theo [AGENTS.md](../AGENTS.md). Khi sửa xong hết thì xoá file này.

Vị trí code ghi theo **tên hàm/biến** (số dòng có thể lệch).

---

## [ ] 1. Đổi cơ sở vẫn hiện dữ liệu của cơ sở khác — HIGH

**Tái hiện:** topbar chọn "Khu trọ An Phú" (0 phòng) → Tổng quan, Hóa đơn, Công nợ, Hợp đồng, Sổ thu chi vẫn hiện dữ liệu Bình An ("Phải thu 28.313.500 đ · 0 phòng đang thuê", "9 / 10 hợp đồng").

**Nguyên nhân:** `src/App.tsx` chỉ lọc `rooms` theo `currentProperty.id` (`propertyRooms`). `invoices`, `contracts`, `tenants`, `vehicles`, `transactions` dùng thẳng toàn bộ mảng (~30 chỗ).

**Cách sửa (ít đụng code nhất):**
1. Đổi tên state gốc: `const [allInvoices, setInvoices] = useState...` (tương tự `allContracts`, `allTenants`, `allVehicles`, `allTransactions`). Setter giữ nguyên tên.
2. Ngay sau `currentProperty`, tạo bản đã lọc với tên cũ:
   ```ts
   const invoices = useMemo(() => allInvoices.filter((i) => i.propertyId === currentProperty.id), [allInvoices, currentProperty.id]);
   ```
   → mọi chỗ đọc dữ liệu tự đúng, không phải sửa từng chỗ.
3. Những chỗ **phải dùng mảng đầy đủ** `all*`: effect lưu localStorage, payload `handleSyncGoogleSheets`, đánh mã mới trong `handleCreateContract` (`HD-${allContracts.length + 1}`, `KH-${allTenants.length + 1}`), và props truyền xuống modal nếu modal cần dữ liệu ngoài cơ sở.
4. Các setter dùng `prev => ...` nên vẫn cập nhật đúng trên mảng đầy đủ.

## [ ] 2. "Khôi phục dữ liệu mẫu" xoá dữ liệu không hỏi xác nhận — HIGH

**Tái hiện:** thu tiền P101 (sổ thu chi 23 bút toán) → bấm "Khôi phục dữ liệu mẫu" ở topbar → còn 20, mất khoản vừa thu, không có hộp xác nhận.

**Cách sửa:** đầu hàm `handleResetDemoData` (`src/App.tsx`):
```ts
if (!window.confirm('Xoá toàn bộ dữ liệu đang có và nạp lại dữ liệu mẫu? Không hoàn tác được.')) return;
```
Nút này có ở 2 chỗ (topbar và trang Cài đặt), cả hai gọi chung hàm nên sửa một lần là đủ.

## [ ] 3. Ghi chỉ số mới nhỏ hơn chỉ số cũ vẫn lưu, tiền điện = 0 — HIGH

**Tái hiện:** Hóa đơn → "Ghi chỉ số hàng loạt" → P101 nhập điện 1000 (cũ 1282) → "Lưu & Lập hóa đơn tất cả phòng ngay" → HD-IV-00089: elecNew 1000, tiền điện 0 đ, tổng 2.690.000 đ < đã thu 2.928.000 đ. Kỳ sau lấy 1000 làm chỉ số cũ.

**Cách sửa:** trong `MeterReadingModal` (`src/components/Modals.tsx`):
1. Tính danh sách phòng lỗi: `Object.entries(readings).filter(([, r]) => r.elecNew < r.elecOld || r.waterNew < r.waterOld)`.
2. Hiện chữ đỏ dưới ô nhập khi `currentReading.elecNew < currentReading.elecOld` (tương tự nước): "Chỉ số mới nhỏ hơn chỉ số cũ".
3. Ở **cả 2 chỗ** gọi `onSaveReadingsAndCreateInvoices(readings)`: nếu còn phòng lỗi thì không lưu, hiện tên phòng lỗi (hoặc nhảy `setCurrentIndex` tới phòng đó).

## [ ] 4. Form tạo hợp đồng không có ô SĐT/CCCD — HIGH

**Tái hiện:** Hợp đồng → "Tạo hợp đồng mới" → nhập tên → tạo → khách mới luôn có SĐT `0918668899`, CCCD `079201008899`. Nút "Mở Zalo" và khai báo tạm trú dùng số sai.

**Cách sửa:** `CreateContractModal` (`src/components/Modals.tsx`):
1. Đổi giá trị mặc định `tenantPhone`, `tenantCccd` thành `''`.
2. Thêm 2 ô input (cạnh ô "Khách thuê đại diện"): SĐT `type="tel" required pattern="0\d{9}"`, CCCD `inputMode="numeric" pattern="\d{12}"`.
3. Nếu chọn tên có sẵn trong gợi ý thì tự điền SĐT/CCCD từ `tenants`.

## [ ] 5. Hợp đồng nhận ngày kết thúc trước ngày bắt đầu — MEDIUM

**Tái hiện:** tạo hợp đồng bắt đầu 11/10/2026, kết thúc 01/01/2020 → vẫn tạo, trạng thái `active`, `daysRemaining: 365`.

**Cách sửa:**
1. Trong `handleSubmit` của `CreateContractModal`: parse `DD/MM/YYYY` → nếu `end <= start` thì không gửi, hiện lỗi dưới ô ngày kết thúc. Nên đổi 3 ô ngày sang `<input type="date">` cho đỡ phải tự parse (nhớ đổi lại định dạng `DD/MM/YYYY` khi lưu vì cả app dùng định dạng này).
2. Trong `handleCreateContract` (`src/App.tsx`): thay `daysRemaining: 365` bằng số ngày thật từ ngày hiện tại của app tới `endDate`.

## [ ] 6. Tạo hợp đồng không sinh hóa đơn kỳ đầu (pro-rata) — MEDIUM

**Tái hiện:** tạo hợp đồng cho P202 → toast báo "Kỳ đầu: 1.693.548 đ" nhưng Hóa đơn/Công nợ không có dòng P202.

**Cách sửa:** trong `handleCreateContract`, sau `setTenants`, thêm 1 `Invoice` vào `setInvoices`:
- `billingMonth` = tháng của `startDate` (dạng `YYYY-MM`). Lưu ý kiểu `Invoice['billingMonth']` đang khoá cứng `'2026-09' | '2026-10' | '2026-11'` trong `src/types.ts` → nới thành `string`.
- `rentAmount = payload.firstPeriodRent`, `periodLabel = payload.firstPeriodLabel`, chỉ số điện/nước cũ = mới = `room.elecIndex`/`room.waterIndex`, phí rác/internet/xe lấy từ phòng, `status: 'unpaid'`, `paidAmount: 0`.
- Mã: `HD-IV-${String(allInvoices.length + 1).padStart(5, '0')}` (sau khi làm mục 1), hoặc lấy số lớn nhất hiện có + 1 để không trùng.

## [ ] 7. "Đã thu đủ" hiện màu đỏ ở cột Công nợ — LOW

**Tái hiện:** thu đủ P101 → Hóa đơn → Theo phòng → cột Công nợ của P101 là "Đã thu đủ" màu đỏ như dòng còn nợ.

**Cách sửa:** `src/App.tsx`, ô `<td>` hiển thị `'Đã thu đủ'` (bảng Hóa đơn → Theo phòng): đổi class cố định `text-rose-600` thành có điều kiện:
```tsx
className={`py-3.5 px-3 text-right font-bold ${rem > 0 ? 'text-rose-600' : inv.status === 'draft' ? 'text-slate-400' : 'text-emerald-600'}`}
```

---

## Đã kiểm tra, không lỗi

Tìm kiếm toàn cục; thu tiền FIFO (giới hạn số tiền, màn hình phân bổ, Tổng quan cập nhật); phiếu báo Zalo/VietQR (cộng tiền, đọc số bằng chữ, ảnh QR); giao diện 375px; console không lỗi; Apps Script `/exec` và `?action=getState` truy cập ẩn danh OK.
