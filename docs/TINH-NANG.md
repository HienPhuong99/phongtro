# Danh sách tính năng OptiRent (23/10/2026)

## Tính năng hiện có

### Tổng quan & Lịch
1. **Tổng quan:** xem tỷ lệ lấp đầy, tiền thu hôm nay, lợi nhuận và việc cần làm.
2. **Lịch:** nhắc ngày ghi số, hạn thu tiền và hợp đồng sắp hết hạn.
3. **Tổng quan nhiều khu:** một màn hình xem đã thu, còn nợ, phòng trống của mọi khu.
4. **Đổi cơ sở:** chọn khu nào thì mọi màn hình chỉ hiện dữ liệu khu đó.

### Phòng – Khách – Hợp đồng
5. **Sơ đồ phòng:** xem phòng theo tầng, kèm trạng thái trống hoặc đang thuê.
6. **Chỉnh giá phòng:** sửa giá từng phòng hoặc cả loạt, tự cập nhật sang hợp đồng và hóa đơn chưa thu.
7. **Khách thuê:** lưu người đại diện, người ở cùng và CCCD.
8. **Xe:** quản lý xe của khách.
9. **Mẫu CT01:** xuất tờ khai đăng ký cư trú.
10. **Hợp đồng:** tạo hợp đồng, kiểm tra ngày, tự lập hóa đơn kỳ đầu theo số ngày ở thực tế.

### Hóa đơn
11. **Ghi chỉ số hàng loạt:** nhập điện nước nhiều phòng một lúc, chặn khi số mới nhỏ hơn số cũ.
12. **Phiếu báo VietQR:** có mã QR chuyển khoản, đã trừ phần khách trả trước.
13. **Tin Zalo soạn sẵn:** tin nhắn kèm link hóa đơn, có nút Chia sẻ.
14. **Sửa, huỷ, gửi lại hóa đơn:** chủ trọ tự làm, không cần gọi hỗ trợ.
15. **Trang hóa đơn cho người thuê:** khách mở link xem phiếu và bấm "Tôi đã chuyển".
16. **Xác nhận tiền đã chuyển:** chủ trọ đối chiếu với ngân hàng rồi bấm xác nhận thì mới gạch nợ.

### Tài chính & Báo cáo
17. **Sổ thu chi:** ghi mọi khoản thu và chi.
18. **Quỹ:** số dư theo từng hình thức, tiền mặt hoặc chuyển khoản.
19. **Công nợ:** danh sách phòng còn nợ.
20. **Thu tiền FIFO:** tiền khách trả tự gạch các kỳ nợ cũ nhất trước.
21. **Cọc phải trả:** theo dõi tiền cọc, quyết toán và hoàn cọc khi khách trả phòng.
22. **Báo cáo:** thực thu, chi phí, lợi nhuận, xếp hạng phòng, xuất CSV.
23. **Tính lại giá điện:** chuyển sang cơ cấu giá điện mới và tạo phụ lục hợp đồng.
24. **Cảnh báo giá điện:** báo khi giá đặt trên 3.460 đ/kWh.

### Tài khoản & Dữ liệu
25. **Đăng nhập Cloud:** dữ liệu mỗi chủ trọ tách riêng trên Supabase.
26. **Dùng khi mất mạng:** có bản sao trên máy, tự đồng bộ lại khi có mạng và báo nếu bị xung đột.
27. **Tài khoản phụ:** người nhà chỉ ghi số và thu tiền, không xem được lợi nhuận.
28. **Tải dữ liệu ra Excel:** xuất toàn bộ dữ liệu ra file .xlsx.
29. **Xoá tài khoản:** xoá sạch dữ liệu trên máy chủ.
30. **Nhập liệu hộ:** script chạy trên máy quản trị, đưa sổ Excel của chủ trọ lên tài khoản của họ.
31. **Đồng bộ Google Sheets:** bản Apps Script cũ, có khóa bảo vệ bằng mã.
32. **Bản di động:** web `?mode=mobile`.
33. **Bản Demo:** dữ liệu mẫu để dùng thử và đi phỏng vấn.

**Đang chờ:** SePay tự động gạch nợ (chờ SePay duyệt).

## Bảng giá dự kiến

| Gói | Giá | Giới hạn | Có thêm |
|---|---|---|---|
| Miễn phí | 0đ | ≤10 phòng, 1 khu | Không có tài khoản phụ, không có SePay |
| Tiêu chuẩn | 149k/tháng | ≤30 phòng, 3 khu | Đầy đủ tính năng P1 |
| Chuyên nghiệp | 249k/tháng | ≤60 phòng, không giới hạn khu | + tài khoản phụ, SePay tự gạch nợ |
| Trên 60 phòng | Từ 399k/tháng | Thoả thuận | — |

**Lưu ý:** code chưa phân gói. Cột `plan_tier` đã có trong database nhưng app chưa đọc, nên mọi tài khoản đều dùng được tất cả tính năng.

## Đề xuất thêm cho Premium

### Ưu tiên cao
1. **SePay tự gạch nợ:** tiền vào tài khoản là app tự đánh dấu đã thu.
2. **Nhắc nợ tự động qua Zalo (ZNS):** tự gửi tin nhắc khách nợ quá hạn, gói kèm một số tin mỗi tháng.
3. **Báo cáo theo kỳ khai thuế:** doanh thu theo quý hoặc năm, xuất sẵn để khai thuế.
4. **Chụp đồng hồ, đọc số tự động (OCR):** chụp ảnh là điền chỉ số, kèm ảnh làm bằng chứng.
5. **Hợp đồng ký online:** khách ký trên điện thoại, lưu file PDF.

### Ưu tiên vừa
6. **Phân quyền chi tiết:** mỗi quản lý chỉ thấy khu của mình.
7. **Nhật ký thao tác:** ghi lại ai sửa hóa đơn hay thu tiền lúc nào.
8. **Đăng tin phòng trống:** tạo tin đăng từ dữ liệu phòng, kèm ảnh và giá.
9. **Dự báo dòng tiền:** ước tính tiền sẽ thu và hợp đồng sắp hết trong 3 tháng tới.
10. **Báo cáo so sánh:** so các khu và các tháng với nhau.

**Giữ ở gói Miễn phí:** tải Excel, xoá tài khoản (luật bảo vệ dữ liệu cá nhân bắt buộc), trang hóa đơn cho người thuê (kênh giới thiệu app tới chủ trọ khác).

**Đề xuất gói Chuyên nghiệp 249k:** gồm mục 1, 2, 3, 6, 7. Các mục còn lại chốt sau khi phỏng vấn chủ trọ.
