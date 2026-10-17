/**
 * Quản lý phòng trọ — Hệ thống quản lý phòng trọ, hợp đồng, điện nước và công nợ
 * Google Sheets + Google Apps Script Backend & Web App
 *
 * Tự động khởi tạo 7 trang tính (Sheets):
 * 1. Phong (Danh sách 12 phòng P101..P304)
 * 2. KhachThue (Danh sách 26 khách thuê KH-00001..KH-00026)
 * 3. DanhSachXe (Danh sách 9 xe máy)
 * 4. HopDong (Danh sách 10 hợp đồng HD-00001..HD-00010)
 * 5. HoaDon (Danh sách 27 hóa đơn qua 3 kỳ 2026-09, 2026-10, 2026-11)
 * 6. SoThuChi (Sổ thu chi & lịch sử thanh toán FIFO)
 * 7. CaiDat (Thông tin cấu hình, đơn giá điện nước & State JSON đồng bộ 2 chiều)
 */

var SHEET_NAMES = {
  ROOMS: 'Phong',
  TENANTS: 'KhachThue',
  VEHICLES: 'DanhSachXe',
  CONTRACTS: 'HopDong',
  INVOICES: 'HoaDon',
  TRANSACTIONS: 'SoThuChi',
  SETTINGS: 'CaiDat'
};

/**
 * Thêm menu tùy chỉnh khi mở Google Sheets
 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('🏠 Quản lý phòng trọ')
      .addItem('🚀 Khởi tạo / Làm mới dữ liệu mẫu', 'setupPhongTroSheets')
      .addItem('📊 Xem báo cáo tổng quan', 'showQuickSummary')
      .addSeparator()
      .addItem('🌐 Mở giao diện Web App', 'openWebAppModal')
      .addToUi();
  } catch (err) {
    Logger.log('onOpen skipped: ' + err);
  }
}

/**
 * Xử lý HTTP GET:
 * - ?action=getState hoặc ?format=json => Trả về JSON dữ liệu cho Web App
 * - ?action=init => Khởi tạo dữ liệu trên Google Sheets và trả về kết quả JSON
 * - Mặc định => Render giao diện Web App từ Index.html
 */
function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var action = params.action || '';
  var format = params.format || '';

  if (action === 'init') {
    var initResult = setupPhongTroSheets();
    return jsonResponse({
      ok: true,
      message: 'Đã khởi tạo thành công 7 bảng dữ liệu Quản lý phòng trọ trên Google Sheets',
      spreadsheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      result: initResult
    });
  }

  if (action === 'getState' || format === 'json') {
    ensureSheetsInitialized();
    var state = readStateFromSheets();
    return jsonResponse({
      ok: true,
      spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId(),
      spreadsheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      updatedAt: new Date().toISOString(),
      state: state
    });
  }

  ensureSheetsInitialized();
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Quản lý phòng trọ')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Xử lý HTTP POST (Đồng bộ dữ liệu 2 chiều từ Web App về Google Sheets)
 */
function doPost(e) {
  try {
    ensureSheetsInitialized();
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var payload = JSON.parse(raw);
    var action = payload.action || 'syncState';

    if (action === 'syncState' && payload.state) {
      writeStateToSheets(payload.state);
      return jsonResponse({
        ok: true,
        action: 'syncState',
        updatedAt: new Date().toISOString(),
        spreadsheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl()
      });
    }

    if (action === 'resetSeed') {
      setupPhongTroSheets();
      return jsonResponse({
        ok: true,
        action: 'resetSeed',
        state: readStateFromSheets()
      });
    }

    return jsonResponse({
      ok: false,
      error: 'Action không hợp lệ: ' + action
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: String(err)
    });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Đảm bảo Google Sheets đã có đủ các bảng dữ liệu
 */
function ensureSheetsInitialized() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var roomSheet = ss.getSheetByName(SHEET_NAMES.ROOMS);
  if (!roomSheet || roomSheet.getLastRow() < 2) {
    setupPhongTroSheets();
  }
}

/**
 * Khởi tạo toàn bộ 7 sheet với dữ liệu mẫu mặc định
 */
function setupPhongTroSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var seed = getDefaultSeedData();
  writeStateToSheets(seed);

  // Xóa Sheet1 mặc định nếu còn trống
  var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Trang tính1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try {
      ss.deleteSheet(defaultSheet);
    } catch (e) {}
  }

  return {
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    roomsCount: seed.rooms.length,
    tenantsCount: seed.tenants.length,
    contractsCount: seed.contracts.length,
    invoicesCount: seed.invoices.length
  };
}

/**
 * Ghi toàn bộ trạng thái ứng dụng xuống 7 sheet trên Google Sheets
 */
function writeStateToSheets(state) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Bảng Phong
  var roomRows = (state.rooms || []).map(function(r) {
    return [
      r.id,
      r.name,
      r.floor,
      r.building || 'Nhà trọ Bình An',
      r.status,
      r.price,
      r.deposit,
      r.tenantName || '',
      r.tenantPhone || '',
      r.occupantsCount || 0,
      r.maxOccupants || 3,
      r.vehiclesCount || 0,
      r.contractCode || '',
      r.contractEnd || '',
      r.debt || 0,
      r.note || ''
    ];
  });
  writeTable(
    ss,
    SHEET_NAMES.ROOMS,
    [
      'Mã Phòng', 'Tên Phòng', 'Tầng', 'Cơ Sở', 'Trạng Thái',
      'Giá Thuê (VNĐ)', 'Tiền Cọc (VNĐ)', 'Khách Đại Diện', 'SĐT',
      'Số Người Ở', 'Tối Đa', 'Số Xe', 'Mã Hợp Đồng', 'Hạn Hợp Đồng', 'Công Nợ (VNĐ)', 'Ghi Chú'
    ],
    roomRows
  );

  // 2. Bảng KhachThue
  var tenantRows = (state.tenants || []).map(function(t) {
    return [
      t.id,
      t.code,
      t.name,
      t.phone,
      t.cccd,
      t.roomId || '',
      t.roomName || '',
      t.building || 'Nhà trọ Bình An',
      t.role,
      t.status,
      t.contractCode || '',
      t.totalPaid || 0,
      t.debt || 0,
      t.moveInDate || ''
    ];
  });
  writeTable(
    ss,
    SHEET_NAMES.TENANTS,
    [
      'ID', 'Mã Khách', 'Họ Tên', 'Số Điện Thoại', 'CCCD',
      'Mã Phòng', 'Tên Phòng', 'Cơ Sở', 'Vai Trò', 'Trạng Thái',
      'Mã Hợp Đồng', 'Đã Thanh Toán (VNĐ)', 'Còn Nợ (VNĐ)', 'Ngày Vào Ở'
    ],
    tenantRows
  );

  // 3. Bảng DanhSachXe
  var vehicleRows = (state.vehicles || []).map(function(v) {
    return [
      v.id,
      v.roomId,
      v.roomName,
      v.building || 'Nhà trọ Bình An',
      v.tenantId,
      v.tenantName,
      v.type,
      v.licensePlate,
      v.note || ''
    ];
  });
  writeTable(
    ss,
    SHEET_NAMES.VEHICLES,
    ['ID', 'Mã Phòng', 'Tên Phòng', 'Cơ Sở', 'Mã Khách', 'Chủ Xe', 'Loại Xe', 'Biển Số', 'Ghi Chú'],
    vehicleRows
  );

  // 4. Bảng HopDong
  var contractRows = (state.contracts || []).map(function(c) {
    return [
      c.id,
      c.code,
      c.roomId,
      c.roomName,
      c.building || 'Nhà trọ Bình An',
      c.tenantId,
      c.tenantName,
      c.tenantPhone,
      c.startDate,
      c.endDate,
      c.rentPrice,
      c.deposit,
      c.status,
      c.refundDue || 0,
      c.refundNote || ''
    ];
  });
  writeTable(
    ss,
    SHEET_NAMES.CONTRACTS,
    [
      'ID', 'Mã Hợp Đồng', 'Mã Phòng', 'Tên Phòng', 'Cơ Sở',
      'Mã Khách', 'Khách Đại Diện', 'SĐT', 'Ngày Bắt Đầu', 'Ngày Kết Thúc',
      'Giá Thuê (VNĐ)', 'Tiền Cọc (VNĐ)', 'Trạng Thái', 'Cọc Phải Trả (VNĐ)', 'Ghi Chú Hoàn Cọc'
    ],
    contractRows
  );

  // 5. Bảng HoaDon
  var invoiceRows = (state.invoices || []).map(function(inv) {
    return [
      inv.id,
      inv.code,
      inv.period,
      inv.periodLabel,
      inv.roomId,
      inv.roomName,
      inv.building || 'Nhà trọ Bình An',
      inv.tenantName,
      inv.tenantPhone,
      inv.rentAmount,
      inv.oldElec,
      inv.newElec,
      inv.elecUsage,
      inv.elecAmount,
      inv.oldWater,
      inv.newWater,
      inv.waterUsage,
      inv.waterAmount,
      inv.serviceAmount,
      inv.totalAmount,
      inv.paidAmount,
      inv.remainingAmount,
      inv.dueDate,
      inv.status
    ];
  });
  writeTable(
    ss,
    SHEET_NAMES.INVOICES,
    [
      'ID', 'Mã Hóa Đơn', 'Kỳ (YYYY-MM)', 'Nhãn Kỳ', 'Mã Phòng', 'Tên Phòng', 'Cơ Sở',
      'Khách Đại Diện', 'SĐT', 'Tiền Phòng', 'Điện Cũ', 'Điện Mới', 'Số kWh', 'Tiền Điện',
      'Nước Cũ', 'Nước Mới', 'Số m3', 'Tiền Nước', 'Phí Dịch Vụ',
      'Tổng Cộng', 'Đã Trả', 'Còn Lại', 'Hạn Thanh Toán', 'Trạng Thái'
    ],
    invoiceRows
  );

  // 6. Bảng SoThuChi
  var txRows = (state.transactions || []).map(function(tx) {
    return [
      tx.id,
      tx.code,
      tx.date,
      tx.type,
      tx.category,
      tx.title,
      tx.roomName || '',
      tx.tenantName || '',
      tx.building || 'Nhà trọ Bình An',
      tx.amount,
      tx.paymentMethod,
      tx.fund,
      tx.invoiceCode || '',
      tx.note || ''
    ];
  });
  writeTable(
    ss,
    SHEET_NAMES.TRANSACTIONS,
    [
      'ID', 'Mã Giao Dịch', 'Ngày', 'Loại (income/expense)', 'Danh Mục',
      'Nội Dung', 'Phòng', 'Khách Thuê', 'Cơ Sở', 'Số Tiền (VNĐ)',
      'Phương Thức', 'Quỹ', 'Mã Hóa Đơn', 'Ghi Chú'
    ],
    txRows
  );

  // 7. Bảng CaiDat & State JSON
  var settingsRows = [
    ['TEN_CO_SO', 'Nhà trọ Bình An', 'Tên nhà trọ chính'],
    ['DIA_CHI', '128 Nguyễn Văn Thương, Bình Thạnh, TP.HCM', 'Địa chỉ cơ sở'],
    ['GIA_DIEN_KWH', 3500, 'Đơn giá điện (VNĐ/kWh)'],
    ['GIA_NUOC_M3', 18000, 'Đơn giá nước (VNĐ/m3)'],
    ['PHI_RAC_THANG', 30000, 'Phí rác sinh hoạt (VNĐ/tháng)'],
    ['PHI_WIFI_THANG', 100000, 'Phí Internet/Wifi (VNĐ/tháng)'],
    ['NGAN_HANG_VIETQR', 'Vietcombank - 1029384756 - NGUYEN QUAN LY TRO', 'Tài khoản nhận thanh toán QR'],
    ['CAP_NHAT_CUOI', new Date().toISOString(), 'Thời điểm đồng bộ gần nhất'],
    ['RAW_STATE_JSON', JSON.stringify(state), 'Dữ liệu JSON đồng bộ 2 chiều với Web App']
  ];
  writeTable(ss, SHEET_NAMES.SETTINGS, ['Khóa Cấu Hình', 'Giá Trị', 'Mô Tả'], settingsRows);
}

/**
 * Đọc trạng thái ứng dụng từ Google Sheets
 */
function readStateFromSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = ss.getSheetByName(SHEET_NAMES.SETTINGS);
  if (settingsSheet && settingsSheet.getLastRow() >= 2) {
    var values = settingsSheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] === 'RAW_STATE_JSON' && values[i][1]) {
        try {
          return JSON.parse(String(values[i][1]));
        } catch (err) {
          Logger.log('Lỗi parse RAW_STATE_JSON: ' + err);
        }
      }
    }
  }
  return getDefaultSeedData();
}

/**
 * Hàm tiện ích ghi bảng dữ liệu và định dạng đẹp mắt
 */
function writeTable(ss, sheetName, headers, rows) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clearContents();
  }

  var allRows = [headers].concat(rows);
  sheet.getRange(1, 1, allRows.length, headers.length).setValues(allRows);

  // Định dạng dòng tiêu đề
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange
    .setBackground('#0D9488')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  sheet.setFrozenRows(1);
}

function showQuickSummary() {
  var state = readStateFromSheets();
  var rented = (state.rooms || []).filter(function(r) { return r.status === 'rented'; }).length;
  var totalRooms = (state.rooms || []).length;
  var unpaid = (state.invoices || []).filter(function(i) { return i.status === 'unpaid'; });
  var totalDebt = unpaid.reduce(function(sum, i) { return sum + Number(i.remainingAmount || 0); }, 0);

  SpreadsheetApp.getUi().alert(
    '📊 Thống kê nhanh Quản lý phòng trọ — Nhà trọ Bình An\n\n' +
    '• Tỷ lệ lấp đầy: ' + rented + '/' + totalRooms + ' phòng (' + Math.round((rented / totalRooms) * 100) + '%)\n' +
    '• Tổng khách thuê: ' + (state.tenants || []).length + ' người\n' +
    '• Hóa đơn chưa thu: ' + unpaid.length + ' hóa đơn\n' +
    '• Tổng công nợ cần thu: ' + totalDebt.toLocaleString('vi-VN') + ' đ'
  );
}

function openWebAppModal() {
  var html = HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setWidth(1200)
    .setHeight(780);
  SpreadsheetApp.getUi().showModalDialog(html, 'Quản lý phòng trọ');
}

/**
 * Dữ liệu mẫu mặc định của hệ thống Quản lý phòng trọ
 */
function getDefaultSeedData() {
  var rooms = [
    { id: 'P101', name: 'Phòng P101', floor: 1, building: 'Nhà trọ Bình An', status: 'rented', price: 2500000, deposit: 2500000, tenantId: 'KH-00001', tenantName: 'Trần Văn Nam', tenantPhone: '0971770075', occupantsCount: 2, maxOccupants: 3, vehiclesCount: 2, contractCode: 'HD-00001', contractStart: '2026-01-21', contractEnd: '2027-01-21', debt: 6961800 },
    { id: 'P102', name: 'Phòng P102', floor: 1, building: 'Nhà trọ Bình An', status: 'rented', price: 2500000, deposit: 2500000, tenantId: 'KH-00003', tenantName: 'Phạm Văn Đức', tenantPhone: '0971317972', occupantsCount: 2, maxOccupants: 3, vehiclesCount: 2, contractCode: 'HD-00002', contractStart: '2026-04-21', contractEnd: '2027-04-21', debt: 7378400 },
    { id: 'P103', name: 'Phòng P103', floor: 1, building: 'Nhà trọ Bình An', status: 'rented', price: 2800000, deposit: 2800000, tenantId: 'KH-00005', tenantName: 'Võ Văn Hải', tenantPhone: '0911191902', occupantsCount: 3, maxOccupants: 3, vehiclesCount: 0, contractCode: 'HD-00003', contractStart: '2026-02-19', contractEnd: '2027-02-19', debt: 8742900 },
    { id: 'P104', name: 'Phòng P104', floor: 1, building: 'Nhà trọ Bình An', status: 'rented', price: 2800000, deposit: 2800000, tenantId: 'KH-00008', tenantName: 'Đặng Văn Khoa', tenantPhone: '0918445222', occupantsCount: 3, maxOccupants: 3, vehiclesCount: 0, contractCode: 'HD-00004', contractStart: '2025-12-21', contractEnd: '2026-12-21', debt: 6691100 },
    { id: 'P201', name: 'Phòng P201', floor: 2, building: 'Nhà trọ Bình An', status: 'rented', price: 2500000, deposit: 2500000, tenantId: 'KH-00011', tenantName: 'Ngô Văn Minh', tenantPhone: '0987857729', occupantsCount: 3, maxOccupants: 3, vehiclesCount: 1, contractCode: 'HD-00005', contractStart: '2025-11-21', contractEnd: '2026-11-21', debt: 7327400 },
    { id: 'P202', name: 'Phòng P202', floor: 2, building: 'Nhà trọ Bình An', status: 'vacant', price: 2500000, deposit: 2500000, occupantsCount: 0, maxOccupants: 3, vehiclesCount: 0, debt: 0, note: 'Huỳnh Thị Hà đã trả phòng (chờ hoàn cọc 909.334đ)' },
    { id: 'P203', name: 'Phòng P203', floor: 2, building: 'Nhà trọ Bình An', status: 'rented', price: 2500000, deposit: 2500000, tenantId: 'KH-00014', tenantName: 'Lý Văn Phong', tenantPhone: '0932325107', occupantsCount: 3, maxOccupants: 3, vehiclesCount: 1, contractCode: 'HD-00006', contractStart: '2026-04-21', contractEnd: '2027-04-21', debt: 7076900 },
    { id: 'P204', name: 'Phòng P204', floor: 2, building: 'Nhà trọ Bình An', status: 'maintenance', price: 2200000, deposit: 2200000, occupantsCount: 0, maxOccupants: 3, vehiclesCount: 0, debt: 0, note: 'Đang sửa chữa máy lạnh & chống thấm' },
    { id: 'P301', name: 'Phòng P301', floor: 3, building: 'Nhà trọ Bình An', status: 'rented', price: 2200000, deposit: 2200000, tenantId: 'KH-00017', tenantName: 'Trương Văn Quân', tenantPhone: '0911732568', occupantsCount: 3, maxOccupants: 3, vehiclesCount: 1, contractCode: 'HD-00007', contractStart: '2025-10-21', contractEnd: '2026-10-21', debt: 7872500 },
    { id: 'P302', name: 'Phòng P302', floor: 3, building: 'Nhà trọ Bình An', status: 'rented', price: 2200000, deposit: 2200000, tenantId: 'KH-00020', tenantName: 'Đinh Văn Sơn', tenantPhone: '0979608804', occupantsCount: 2, maxOccupants: 3, vehiclesCount: 2, contractCode: 'HD-00008', contractStart: '2025-10-21', contractEnd: '2026-10-21', debt: 6759400 },
    { id: 'P303', name: 'Phòng P303', floor: 3, building: 'Nhà trọ Bình An', status: 'rented', price: 2500000, deposit: 2500000, tenantId: 'KH-00022', tenantName: 'Lương Văn Tùng', tenantPhone: '0916808935', occupantsCount: 3, maxOccupants: 3, vehiclesCount: 0, contractCode: 'HD-00009', contractStart: '2026-01-21', contractEnd: '2027-01-21', debt: 6812500 },
    { id: 'P304', name: 'Phòng P304', floor: 3, building: 'Nhà trọ Bình An', status: 'vacant', price: 2700000, deposit: 2700000, occupantsCount: 0, maxOccupants: 3, vehiclesCount: 0, debt: 0, note: 'Phòng trống sẵn sàng đón khách' }
  ];

  var tenants = [
    { id: 'KH-00001', code: 'KH-00001', name: 'Trần Văn Nam', phone: '0971770075', cccd: '079201001001', roomId: 'P101', roomName: 'Phòng P101', building: 'Nhà trọ Bình An', role: 'representative', status: 'staying', contractCode: 'HD-00001', totalPaid: 13265000, debt: 6961800, moveInDate: '2026-01-21' },
    { id: 'KH-00002', code: 'KH-00002', name: 'Lê Thị Hoa', phone: '0932751487', cccd: '079201001002', roomId: 'P101', roomName: 'Phòng P101', building: 'Nhà trọ Bình An', role: 'member', status: 'staying', contractCode: 'HD-00001', totalPaid: 0, debt: 0, moveInDate: '2026-01-21' },
    { id: 'KH-00003', code: 'KH-00003', name: 'Phạm Văn Đức', phone: '0971317972', cccd: '079201001003', roomId: 'P102', roomName: 'Phòng P102', building: 'Nhà trọ Bình An', role: 'representative', status: 'staying', contractCode: 'HD-00002', totalPaid: 10948700, debt: 7378400, moveInDate: '2026-04-21' },
    { id: 'KH-00004', code: 'KH-00004', name: 'Nguyễn Thị Mai', phone: '0989021863', cccd: '079201001004', roomId: 'P102', roomName: 'Phòng P102', building: 'Nhà trọ Bình An', role: 'member', status: 'staying', contractCode: 'HD-00002', totalPaid: 0, debt: 0, moveInDate: '2026-04-21' },
    { id: 'KH-00005', code: 'KH-00005', name: 'Võ Văn Hải', phone: '0911191902', cccd: '079201001005', roomId: 'P103', roomName: 'Phòng P103', building: 'Nhà trọ Bình An', role: 'representative', status: 'staying', contractCode: 'HD-00003', totalPaid: 11798300, debt: 8742900, moveInDate: '2026-02-19' },
    { id: 'KH-00006', code: 'KH-00006', name: 'Hoàng Thị Lan', phone: '0904569581', cccd: '079201001006', roomId: 'P103', roomName: 'Phòng P103', building: 'Nhà trọ Bình An', role: 'member', status: 'staying', contractCode: 'HD-00003', totalPaid: 0, debt: 0, moveInDate: '2026-02-19' },
    { id: 'KH-00007', code: 'KH-00007', name: 'Bùi Văn Tùng', phone: '0971784346', cccd: '079201001007', roomId: 'P103', roomName: 'Phòng P103', building: 'Nhà trọ Bình An', role: 'member', status: 'staying', contractCode: 'HD-00003', totalPaid: 0, debt: 0, moveInDate: '2026-02-19' },
    { id: 'KH-00008', code: 'KH-00008', name: 'Đặng Văn Khoa', phone: '0918445222', cccd: '079201001008', roomId: 'P104', roomName: 'Phòng P104', building: 'Nhà trọ Bình An', role: 'representative', status: 'staying', contractCode: 'HD-00004', totalPaid: 13965200, debt: 6691100, moveInDate: '2025-12-21' },
    { id: 'KH-00009', code: 'KH-00009', name: 'Đỗ Thị Ngọc', phone: '0972748112', cccd: '079201001009', roomId: 'P104', roomName: 'Phòng P104', building: 'Nhà trọ Bình An', role: 'member', status: 'staying', contractCode: 'HD-00004', totalPaid: 0, debt: 0, moveInDate: '2025-12-21' },
    { id: 'KH-00010', code: 'KH-00010', name: 'Hồ Văn Long', phone: '0904000282', cccd: '079201001010', roomId: 'P104', roomName: 'Phòng P104', building: 'Nhà trọ Bình An', role: 'member', status: 'staying', contractCode: 'HD-00004', totalPaid: 0, debt: 0, moveInDate: '2025-12-21' },
    { id: 'KH-00011', code: 'KH-00011', name: 'Ngô Văn Minh', phone: '0987857729', cccd: '079201001011', roomId: 'P201', roomName: 'Phòng P201', building: 'Nhà trọ Bình An', role: 'representative', status: 'staying', contractCode: 'HD-00005', totalPaid: 10961200, debt: 7327400, moveInDate: '2025-11-21' },
    { id: 'KH-00012', code: 'KH-00012', name: 'Dương Thị Thảo', phone: '0904029944', cccd: '079201001012', roomId: 'P201', roomName: 'Phòng P201', building: 'Nhà trọ Bình An', role: 'member', status: 'staying', contractCode: 'HD-00005', totalPaid: 0, debt: 0, moveInDate: '2025-11-21' },
    { id: 'KH-00013', code: 'KH-00013', name: 'Lý Thị Hạnh', phone: '0912345013', cccd: '079201001013', roomId: 'P201', roomName: 'Phòng P201', building: 'Nhà trọ Bình An', role: 'member', status: 'staying', contractCode: 'HD-00005', totalPaid: 0, debt: 0, moveInDate: '2025-11-21' },
    { id: 'KH-00014', code: 'KH-00014', name: 'Lý Văn Phong', phone: '0932325107', cccd: '079201001014', roomId: 'P203', roomName: 'Phòng P203', building: 'Nhà trọ Bình An', role: 'representative', status: 'staying', contractCode: 'HD-00006', totalPaid: 11240000, debt: 7076900, moveInDate: '2026-04-21' },
    { id: 'KH-00015', code: 'KH-00015', name: 'Vũ Thị Trang', phone: '0912345015', cccd: '079201001015', roomId: 'P203', roomName: 'Phòng P203', building: 'Nhà trọ Bình An', role: 'member', status: 'staying', contractCode: 'HD-00006', totalPaid: 0, debt: 0, moveInDate: '2026-04-21' },
    { id: 'KH-00016', code: 'KH-00016', name: 'Trịnh Văn Đạt', phone: '0912345016', cccd: '079201001016', roomId: 'P203', roomName: 'Phòng P203', building: 'Nhà trọ Bình An', role: 'member', status: 'staying', contractCode: 'HD-00006', totalPaid: 0, debt: 0, moveInDate: '2026-04-21' },
    { id: 'KH-00017', code: 'KH-00017', name: 'Trương Văn Quân', phone: '0911732568', cccd: '079201001017', roomId: 'P301', roomName: 'Phòng P301', building: 'Nhà trọ Bình An', role: 'representative', status: 'staying', contractCode: 'HD-00007', totalPaid: 9850000, debt: 7872500, moveInDate: '2025-10-21' },
    { id: 'KH-00018', code: 'KH-00018', name: 'Phan Thị Yến', phone: '0912345018', cccd: '079201001018', roomId: 'P301', roomName: 'Phòng P301', building: 'Nhà trọ Bình An', role: 'member', status: 'staying', contractCode: 'HD-00007', totalPaid: 0, debt: 0, moveInDate: '2025-10-21' },
    { id: 'KH-00019', code: 'KH-00019', name: 'Đoàn Văn Kiên', phone: '0912345019', cccd: '079201001019', roomId: 'P301', roomName: 'Phòng P301', building: 'Nhà trọ Bình An', role: 'member', status: 'staying', contractCode: 'HD-00007', totalPaid: 0, debt: 0, moveInDate: '2025-10-21' },
    { id: 'KH-00020', code: 'KH-00020', name: 'Đinh Văn Sơn', phone: '0979608804', cccd: '079201001020', roomId: 'P302', roomName: 'Phòng P302', building: 'Nhà trọ Bình An', role: 'representative', status: 'staying', contractCode: 'HD-00008', totalPaid: 10120000, debt: 6759400, moveInDate: '2025-10-21' },
    { id: 'KH-00021', code: 'KH-00021', name: 'Lâm Thị Bích', phone: '0912345021', cccd: '079201001021', roomId: 'P302', roomName: 'Phòng P302', building: 'Nhà trọ Bình An', role: 'member', status: 'staying', contractCode: 'HD-00008', totalPaid: 0, debt: 0, moveInDate: '2025-10-21' },
    { id: 'KH-00022', code: 'KH-00022', name: 'Lương Văn Tùng', phone: '0916808935', cccd: '079201001022', roomId: 'P303', roomName: 'Phòng P303', building: 'Nhà trọ Bình An', role: 'representative', status: 'staying', contractCode: 'HD-00009', totalPaid: 11450000, debt: 6812500, moveInDate: '2026-01-21' },
    { id: 'KH-00023', code: 'KH-00023', name: 'Mai Thị Linh', phone: '0912345023', cccd: '079201001023', roomId: 'P303', roomName: 'Phòng P303', building: 'Nhà trọ Bình An', role: 'member', status: 'staying', contractCode: 'HD-00009', totalPaid: 0, debt: 0, moveInDate: '2026-01-21' },
    { id: 'KH-00024', code: 'KH-00024', name: 'Cao Văn Huy', phone: '0912345024', cccd: '079201001024', roomId: 'P303', roomName: 'Phòng P303', building: 'Nhà trọ Bình An', role: 'member', status: 'staying', contractCode: 'HD-00009', totalPaid: 0, debt: 0, moveInDate: '2026-01-21' },
    { id: 'KH-00025', code: 'KH-00025', name: 'Huỳnh Thị Hà', phone: '0936221034', cccd: '079201001025', roomId: undefined, roomName: undefined, building: 'Nhà trọ Bình An', role: 'former', status: 'moved_out', contractCode: 'HD-00010', totalPaid: 8550000, debt: 0, moveInDate: '2025-11-21' },
    { id: 'KH-00026', code: 'KH-00026', name: 'Tạ Văn Bình', phone: '0912345026', cccd: '079201001026', roomId: undefined, roomName: undefined, building: 'Nhà trọ Bình An', role: 'former', status: 'moved_out', contractCode: 'HD-00010', totalPaid: 0, debt: 0, moveInDate: '2025-11-21' }
  ];

  var vehicles = [
    { id: 'XE-01', roomId: 'P101', roomName: 'Phòng P101', building: 'Nhà trọ Bình An', tenantId: 'KH-00001', tenantName: 'Trần Văn Nam', type: 'Xe máy', licensePlate: '59X1-10000', note: 'Honda AirBlade đen' },
    { id: 'XE-02', roomId: 'P101', roomName: 'Phòng P101', building: 'Nhà trọ Bình An', tenantId: 'KH-00002', tenantName: 'Lê Thị Hoa', type: 'Xe máy', licensePlate: '59X1-12193', note: 'Honda Vision trắng' },
    { id: 'XE-03', roomId: 'P102', roomName: 'Phòng P102', building: 'Nhà trọ Bình An', tenantId: 'KH-00003', tenantName: 'Phạm Văn Đức', type: 'Xe máy', licensePlate: '59X1-14386', note: 'Yamaha Exciter xanh' },
    { id: 'XE-04', roomId: 'P102', roomName: 'Phòng P102', building: 'Nhà trọ Bình An', tenantId: 'KH-00004', tenantName: 'Nguyễn Thị Mai', type: 'Xe máy', licensePlate: '59X1-16579', note: 'Honda Lead bạc' },
    { id: 'XE-05', roomId: 'P201', roomName: 'Phòng P201', building: 'Nhà trọ Bình An', tenantId: 'KH-00011', tenantName: 'Ngô Văn Minh', type: 'Xe máy', licensePlate: '59X1-18772', note: 'Wave Alpha đỏ' },
    { id: 'XE-06', roomId: 'P203', roomName: 'Phòng P203', building: 'Nhà trọ Bình An', tenantId: 'KH-00014', tenantName: 'Lý Văn Phong', type: 'Xe máy', licensePlate: '59X1-20965', note: 'Honda Vario xám' },
    { id: 'XE-07', roomId: 'P301', roomName: 'Phòng P301', building: 'Nhà trọ Bình An', tenantId: 'KH-00017', tenantName: 'Trương Văn Quân', type: 'Xe máy', licensePlate: '59X1-23158', note: 'Yamaha Sirius đen' },
    { id: 'XE-08', roomId: 'P302', roomName: 'Phòng P302', building: 'Nhà trọ Bình An', tenantId: 'KH-00020', tenantName: 'Đinh Văn Sơn', type: 'Xe máy', licensePlate: '59X1-25351', note: 'Honda Future xanh' },
    { id: 'XE-09', roomId: 'P302', roomName: 'Phòng P302', building: 'Nhà trọ Bình An', tenantId: 'KH-00021', tenantName: 'Lâm Thị Bích', type: 'Xe máy', licensePlate: '59X1-27544', note: 'Yamaha Grande trắng' }
  ];

  var contracts = [
    { id: 'HD-00001', code: 'HD-00001', roomId: 'P101', roomName: 'Phòng P101', building: 'Nhà trọ Bình An', tenantId: 'KH-00001', tenantName: 'Trần Văn Nam', tenantPhone: '0971770075', startDate: '2026-01-21', endDate: '2027-01-21', rentPrice: 2500000, deposit: 2500000, status: 'active' },
    { id: 'HD-00002', code: 'HD-00002', roomId: 'P102', roomName: 'Phòng P102', building: 'Nhà trọ Bình An', tenantId: 'KH-00003', tenantName: 'Phạm Văn Đức', tenantPhone: '0971317972', startDate: '2026-04-21', endDate: '2027-04-21', rentPrice: 2500000, deposit: 2500000, status: 'active' },
    { id: 'HD-00003', code: 'HD-00003', roomId: 'P103', roomName: 'Phòng P103', building: 'Nhà trọ Bình An', tenantId: 'KH-00005', tenantName: 'Võ Văn Hải', tenantPhone: '0911191902', startDate: '2026-02-19', endDate: '2027-02-19', rentPrice: 2800000, deposit: 2800000, status: 'active' },
    { id: 'HD-00004', code: 'HD-00004', roomId: 'P104', roomName: 'Phòng P104', building: 'Nhà trọ Bình An', tenantId: 'KH-00008', tenantName: 'Đặng Văn Khoa', tenantPhone: '0918445222', startDate: '2025-12-21', endDate: '2026-12-21', rentPrice: 2800000, deposit: 2800000, status: 'active' },
    { id: 'HD-00005', code: 'HD-00005', roomId: 'P201', roomName: 'Phòng P201', building: 'Nhà trọ Bình An', tenantId: 'KH-00011', tenantName: 'Ngô Văn Minh', tenantPhone: '0987857729', startDate: '2025-11-21', endDate: '2026-11-21', rentPrice: 2500000, deposit: 2500000, status: 'active' },
    { id: 'HD-00006', code: 'HD-00006', roomId: 'P203', roomName: 'Phòng P203', building: 'Nhà trọ Bình An', tenantId: 'KH-00014', tenantName: 'Lý Văn Phong', tenantPhone: '0932325107', startDate: '2026-04-21', endDate: '2027-04-21', rentPrice: 2500000, deposit: 2500000, status: 'active' },
    { id: 'HD-00007', code: 'HD-00007', roomId: 'P301', roomName: 'Phòng P301', building: 'Nhà trọ Bình An', tenantId: 'KH-00017', tenantName: 'Trương Văn Quân', tenantPhone: '0911732568', startDate: '2025-10-21', endDate: '2026-10-21', rentPrice: 2200000, deposit: 2200000, status: 'active' },
    { id: 'HD-00008', code: 'HD-00008', roomId: 'P302', roomName: 'Phòng P302', building: 'Nhà trọ Bình An', tenantId: 'KH-00020', tenantName: 'Đinh Văn Sơn', tenantPhone: '0979608804', startDate: '2025-10-21', endDate: '2026-10-21', rentPrice: 2200000, deposit: 2200000, status: 'active' },
    { id: 'HD-00009', code: 'HD-00009', roomId: 'P303', roomName: 'Phòng P303', building: 'Nhà trọ Bình An', tenantId: 'KH-00022', tenantName: 'Lương Văn Tùng', tenantPhone: '0916808935', startDate: '2026-01-21', endDate: '2027-01-21', rentPrice: 2500000, deposit: 2500000, status: 'active' },
    { id: 'HD-00010', code: 'HD-00010', roomId: 'P202', roomName: 'Phòng P202', building: 'Nhà trọ Bình An', tenantId: 'KH-00025', tenantName: 'Huỳnh Thị Hà', tenantPhone: '0936221034', startDate: '2025-11-21', endDate: '2026-10-16', rentPrice: 2500000, deposit: 2500000, status: 'terminated', refundDue: 909334, refundNote: 'Cọc 2.500.000đ · Trừ nợ 1.590.666đ · Hạn hoàn 16/10/2026' }
  ];

  var invoices = [
    { id: 'HD-IV-00052', code: 'HD-IV-00052', period: '2026-09', periodLabel: 'Tháng 9/2026', roomId: 'P101', roomName: 'Phòng P101', building: 'Nhà trọ Bình An', tenantId: 'KH-00001', tenantName: 'Trần Văn Nam', tenantPhone: '0971770075', rentAmount: 2500000, oldElec: 1120, newElec: 1188, elecUsage: 68, elecAmount: 238000, oldWater: 42, newWater: 46, waterUsage: 4, waterAmount: 72000, serviceAmount: 130000, totalAmount: 2940000, paidAmount: 1776200, remainingAmount: 1163800, dueDate: '2026-09-05', status: 'unpaid' },
    { id: 'HD-IV-00070', code: 'HD-IV-00070', period: '2026-10', periodLabel: 'Tháng 10/2026', roomId: 'P101', roomName: 'Phòng P101', building: 'Nhà trọ Bình An', tenantId: 'KH-00001', tenantName: 'Trần Văn Nam', tenantPhone: '0971770075', rentAmount: 2500000, oldElec: 1188, newElec: 1240, elecUsage: 52, elecAmount: 182000, oldWater: 46, newWater: 49, waterUsage: 3, waterAmount: 58000, serviceAmount: 130000, totalAmount: 2870000, paidAmount: 0, remainingAmount: 2870000, dueDate: '2026-10-05', status: 'unpaid' },
    { id: 'HD-IV-00089', code: 'HD-IV-00089', period: '2026-11', periodLabel: 'Tháng 11/2026', roomId: 'P101', roomName: 'Phòng P101', building: 'Nhà trọ Bình An', tenantId: 'KH-00001', tenantName: 'Trần Văn Nam', tenantPhone: '0971770075', rentAmount: 2500000, oldElec: 1240, newElec: 1304, elecUsage: 64, elecAmount: 224000, oldWater: 49, newWater: 53, waterUsage: 4, waterAmount: 74000, serviceAmount: 130000, totalAmount: 2928000, paidAmount: 0, remainingAmount: 2928000, dueDate: '2026-11-05', status: 'unpaid' },
    { id: 'HD-IV-00053', code: 'HD-IV-00053', period: '2026-09', periodLabel: 'Tháng 9/2026', roomId: 'P102', roomName: 'Phòng P102', building: 'Nhà trọ Bình An', tenantId: 'KH-00003', tenantName: 'Phạm Văn Đức', tenantPhone: '0971317972', rentAmount: 2500000, oldElec: 940, newElec: 1012, elecUsage: 72, elecAmount: 252000, oldWater: 31, newWater: 35, waterUsage: 4, waterAmount: 72000, serviceAmount: 130000, totalAmount: 2954000, paidAmount: 1528600, remainingAmount: 1425400, dueDate: '2026-09-05', status: 'unpaid' },
    { id: 'HD-IV-00071', code: 'HD-IV-00071', period: '2026-10', periodLabel: 'Tháng 10/2026', roomId: 'P102', roomName: 'Phòng P102', building: 'Nhà trọ Bình An', tenantId: 'KH-00003', tenantName: 'Phạm Văn Đức', tenantPhone: '0971317972', rentAmount: 2500000, oldElec: 1012, newElec: 1090, elecUsage: 78, elecAmount: 273000, oldWater: 35, newWater: 39, waterUsage: 4, waterAmount: 72000, serviceAmount: 130000, totalAmount: 2975000, paidAmount: 0, remainingAmount: 2975000, dueDate: '2026-10-05', status: 'unpaid' },
    { id: 'HD-IV-00090', code: 'HD-IV-00090', period: '2026-11', periodLabel: 'Tháng 11/2026', roomId: 'P102', roomName: 'Phòng P102', building: 'Nhà trọ Bình An', tenantId: 'KH-00003', tenantName: 'Phạm Văn Đức', tenantPhone: '0971317972', rentAmount: 2500000, oldElec: 1090, newElec: 1168, elecUsage: 78, elecAmount: 273000, oldWater: 39, newWater: 43, waterUsage: 4, waterAmount: 75000, serviceAmount: 130000, totalAmount: 2978000, paidAmount: 0, remainingAmount: 2978000, dueDate: '2026-11-05', status: 'unpaid' },
    { id: 'HD-IV-00054', code: 'HD-IV-00054', period: '2026-09', periodLabel: 'Tháng 9/2026', roomId: 'P103', roomName: 'Phòng P103', building: 'Nhà trọ Bình An', tenantId: 'KH-00005', tenantName: 'Võ Văn Hải', tenantPhone: '0911191902', rentAmount: 2800000, oldElec: 1410, newElec: 1502, elecUsage: 92, elecAmount: 322000, oldWater: 55, newWater: 61, waterUsage: 6, waterAmount: 108000, serviceAmount: 130000, totalAmount: 3360000, paidAmount: 1353100, remainingAmount: 2006900, dueDate: '2026-09-05', status: 'unpaid' },
    { id: 'HD-IV-00072', code: 'HD-IV-00072', period: '2026-10', periodLabel: 'Tháng 10/2026', roomId: 'P103', roomName: 'Phòng P103', building: 'Nhà trọ Bình An', tenantId: 'KH-00005', tenantName: 'Võ Văn Hải', tenantPhone: '0911191902', rentAmount: 2800000, oldElec: 1502, newElec: 1594, elecUsage: 92, elecAmount: 322000, oldWater: 61, newWater: 67, waterUsage: 6, waterAmount: 108000, serviceAmount: 130000, totalAmount: 3360000, paidAmount: 0, remainingAmount: 3360000, dueDate: '2026-10-05', status: 'unpaid' },
    { id: 'HD-IV-00091', code: 'HD-IV-00091', period: '2026-11', periodLabel: 'Tháng 11/2026', roomId: 'P103', roomName: 'Phòng P103', building: 'Nhà trọ Bình An', tenantId: 'KH-00005', tenantName: 'Võ Văn Hải', tenantPhone: '0911191902', rentAmount: 2800000, oldElec: 1594, newElec: 1690, elecUsage: 96, elecAmount: 336000, oldWater: 67, newWater: 73, waterUsage: 6, waterAmount: 110000, serviceAmount: 130000, totalAmount: 3376000, paidAmount: 0, remainingAmount: 3376000, dueDate: '2026-11-05', status: 'unpaid' },
    { id: 'HD-IV-00055', code: 'HD-IV-00055', period: '2026-09', periodLabel: 'Tháng 9/2026', roomId: 'P104', roomName: 'Phòng P104', building: 'Nhà trọ Bình An', tenantId: 'KH-00008', tenantName: 'Đặng Văn Khoa', tenantPhone: '0918445222', rentAmount: 2800000, oldElec: 880, newElec: 960, elecUsage: 80, elecAmount: 280000, oldWater: 28, newWater: 33, waterUsage: 5, waterAmount: 90000, serviceAmount: 130000, totalAmount: 3300000, paidAmount: 3300000, remainingAmount: 0, dueDate: '2026-09-05', status: 'paid' },
    { id: 'HD-IV-00073', code: 'HD-IV-00073', period: '2026-10', periodLabel: 'Tháng 10/2026', roomId: 'P104', roomName: 'Phòng P104', building: 'Nhà trọ Bình An', tenantId: 'KH-00008', tenantName: 'Đặng Văn Khoa', tenantPhone: '0918445222', rentAmount: 2800000, oldElec: 960, newElec: 1052, elecUsage: 92, elecAmount: 322000, oldWater: 33, newWater: 38, waterUsage: 5, waterAmount: 91100, serviceAmount: 130000, totalAmount: 3343100, paidAmount: 0, remainingAmount: 3343100, dueDate: '2026-10-05', status: 'unpaid' },
    { id: 'HD-IV-00092', code: 'HD-IV-00092', period: '2026-11', periodLabel: 'Tháng 11/2026', roomId: 'P104', roomName: 'Phòng P104', building: 'Nhà trọ Bình An', tenantId: 'KH-00008', tenantName: 'Đặng Văn Khoa', tenantPhone: '0918445222', rentAmount: 2800000, oldElec: 1052, newElec: 1146, elecUsage: 94, elecAmount: 329000, oldWater: 38, newWater: 43, waterUsage: 5, waterAmount: 89000, serviceAmount: 130000, totalAmount: 3348000, paidAmount: 0, remainingAmount: 3348000, dueDate: '2026-11-05', status: 'unpaid' },
    { id: 'HD-IV-00056', code: 'HD-IV-00056', period: '2026-09', periodLabel: 'Tháng 9/2026', roomId: 'P201', roomName: 'Phòng P201', building: 'Nhà trọ Bình An', tenantId: 'KH-00011', tenantName: 'Ngô Văn Minh', tenantPhone: '0987857729', rentAmount: 2500000, oldElec: 760, newElec: 834, elecUsage: 74, elecAmount: 259000, oldWater: 24, newWater: 29, waterUsage: 5, waterAmount: 90000, serviceAmount: 130000, totalAmount: 2979000, paidAmount: 1581600, remainingAmount: 1397400, dueDate: '2026-09-05', status: 'unpaid' },
    { id: 'HD-IV-00074', code: 'HD-IV-00074', period: '2026-10', periodLabel: 'Tháng 10/2026', roomId: 'P201', roomName: 'Phòng P201', building: 'Nhà trọ Bình An', tenantId: 'KH-00011', tenantName: 'Ngô Văn Minh', tenantPhone: '0987857729', rentAmount: 2500000, oldElec: 834, newElec: 904, elecUsage: 70, elecAmount: 245000, oldWater: 29, newWater: 34, waterUsage: 5, waterAmount: 90000, serviceAmount: 130000, totalAmount: 2965000, paidAmount: 0, remainingAmount: 2965000, dueDate: '2026-10-05', status: 'unpaid' },
    { id: 'HD-IV-00093', code: 'HD-IV-00093', period: '2026-11', periodLabel: 'Tháng 11/2026', roomId: 'P201', roomName: 'Phòng P201', building: 'Nhà trọ Bình An', tenantId: 'KH-00011', tenantName: 'Ngô Văn Minh', tenantPhone: '0987857729', rentAmount: 2500000, oldElec: 904, newElec: 974, elecUsage: 70, elecAmount: 245000, oldWater: 34, newWater: 39, waterUsage: 5, waterAmount: 90000, serviceAmount: 130000, totalAmount: 2965000, paidAmount: 0, remainingAmount: 2965000, dueDate: '2026-11-05', status: 'unpaid' },
    { id: 'HD-IV-00057', code: 'HD-IV-00057', period: '2026-09', periodLabel: 'Tháng 9/2026', roomId: 'P203', roomName: 'Phòng P203', building: 'Nhà trọ Bình An', tenantId: 'KH-00014', tenantName: 'Lý Văn Phong', tenantPhone: '0932325107', rentAmount: 2500000, oldElec: 610, newElec: 682, elecUsage: 72, elecAmount: 252000, oldWater: 19, newWater: 23, waterUsage: 4, waterAmount: 72000, serviceAmount: 130000, totalAmount: 2954000, paidAmount: 1759100, remainingAmount: 1194900, dueDate: '2026-09-05', status: 'unpaid' },
    { id: 'HD-IV-00075', code: 'HD-IV-00075', period: '2026-10', periodLabel: 'Tháng 10/2026', roomId: 'P203', roomName: 'Phòng P203', building: 'Nhà trọ Bình An', tenantId: 'KH-00014', tenantName: 'Lý Văn Phong', tenantPhone: '0932325107', rentAmount: 2500000, oldElec: 682, newElec: 750, elecUsage: 68, elecAmount: 238000, oldWater: 23, newWater: 27, waterUsage: 4, waterAmount: 73000, serviceAmount: 130000, totalAmount: 2941000, paidAmount: 0, remainingAmount: 2941000, dueDate: '2026-10-05', status: 'unpaid' },
    { id: 'HD-IV-00094', code: 'HD-IV-00094', period: '2026-11', periodLabel: 'Tháng 11/2026', roomId: 'P203', roomName: 'Phòng P203', building: 'Nhà trọ Bình An', tenantId: 'KH-00014', tenantName: 'Lý Văn Phong', tenantPhone: '0932325107', rentAmount: 2500000, oldElec: 750, newElec: 818, elecUsage: 68, elecAmount: 238000, oldWater: 27, newWater: 31, waterUsage: 4, waterAmount: 73000, serviceAmount: 130000, totalAmount: 2941000, paidAmount: 0, remainingAmount: 2941000, dueDate: '2026-11-05', status: 'unpaid' },
    { id: 'HD-IV-00058', code: 'HD-IV-00058', period: '2026-09', periodLabel: 'Tháng 9/2026', roomId: 'P301', roomName: 'Phòng P301', building: 'Nhà trọ Bình An', tenantId: 'KH-00017', tenantName: 'Trương Văn Quân', tenantPhone: '0911732568', rentAmount: 2200000, oldElec: 1310, newElec: 1396, elecUsage: 86, elecAmount: 301000, oldWater: 41, newWater: 46, waterUsage: 5, waterAmount: 90000, serviceAmount: 130000, totalAmount: 2721000, paidAmount: 290500, remainingAmount: 2430500, dueDate: '2026-09-05', status: 'unpaid' },
    { id: 'HD-IV-00076', code: 'HD-IV-00076', period: '2026-10', periodLabel: 'Tháng 10/2026', roomId: 'P301', roomName: 'Phòng P301', building: 'Nhà trọ Bình An', tenantId: 'KH-00017', tenantName: 'Trương Văn Quân', tenantPhone: '0911732568', rentAmount: 2200000, oldElec: 1396, newElec: 1482, elecUsage: 86, elecAmount: 301000, oldWater: 46, newWater: 51, waterUsage: 5, waterAmount: 90000, serviceAmount: 130000, totalAmount: 2721000, paidAmount: 0, remainingAmount: 2721000, dueDate: '2026-10-05', status: 'unpaid' },
    { id: 'HD-IV-00095', code: 'HD-IV-00095', period: '2026-11', periodLabel: 'Tháng 11/2026', roomId: 'P301', roomName: 'Phòng P301', building: 'Nhà trọ Bình An', tenantId: 'KH-00017', tenantName: 'Trương Văn Quân', tenantPhone: '0911732568', rentAmount: 2200000, oldElec: 1482, newElec: 1568, elecUsage: 86, elecAmount: 301000, oldWater: 51, newWater: 56, waterUsage: 5, waterAmount: 90000, serviceAmount: 130000, totalAmount: 2721000, paidAmount: 0, remainingAmount: 2721000, dueDate: '2026-11-05', status: 'unpaid' },
    { id: 'HD-IV-00059', code: 'HD-IV-00059', period: '2026-09', periodLabel: 'Tháng 9/2026', roomId: 'P302', roomName: 'Phòng P302', building: 'Nhà trọ Bình An', tenantId: 'KH-00020', tenantName: 'Đinh Văn Sơn', tenantPhone: '0979608804', rentAmount: 2200000, oldElec: 540, newElec: 610, elecUsage: 70, elecAmount: 245000, oldWater: 18, newWater: 22, waterUsage: 4, waterAmount: 72000, serviceAmount: 130000, totalAmount: 2647000, paidAmount: 1181600, remainingAmount: 1465400, dueDate: '2026-09-05', status: 'unpaid' },
    { id: 'HD-IV-00077', code: 'HD-IV-00077', period: '2026-10', periodLabel: 'Tháng 10/2026', roomId: 'P302', roomName: 'Phòng P302', building: 'Nhà trọ Bình An', tenantId: 'KH-00020', tenantName: 'Đinh Văn Sơn', tenantPhone: '0979608804', rentAmount: 2200000, oldElec: 610, newElec: 680, elecUsage: 70, elecAmount: 245000, oldWater: 22, newWater: 26, waterUsage: 4, waterAmount: 72000, serviceAmount: 130000, totalAmount: 2647000, paidAmount: 0, remainingAmount: 2647000, dueDate: '2026-10-05', status: 'unpaid' },
    { id: 'HD-IV-00096', code: 'HD-IV-00096', period: '2026-11', periodLabel: 'Tháng 11/2026', roomId: 'P302', roomName: 'Phòng P302', building: 'Nhà trọ Bình An', tenantId: 'KH-00020', tenantName: 'Đinh Văn Sơn', tenantPhone: '0979608804', rentAmount: 2200000, oldElec: 680, newElec: 750, elecUsage: 70, elecAmount: 245000, oldWater: 26, newWater: 30, waterUsage: 4, waterAmount: 72000, serviceAmount: 130000, totalAmount: 2647000, paidAmount: 0, remainingAmount: 2647000, dueDate: '2026-11-05', status: 'unpaid' },
    { id: 'HD-IV-00060', code: 'HD-IV-00060', period: '2026-09', periodLabel: 'Tháng 9/2026', roomId: 'P303', roomName: 'Phòng P303', building: 'Nhà trọ Bình An', tenantId: 'KH-00022', tenantName: 'Lương Văn Tùng', tenantPhone: '0916808935', rentAmount: 2500000, oldElec: 820, newElec: 890, elecUsage: 70, elecAmount: 245000, oldWater: 29, newWater: 33, waterUsage: 4, waterAmount: 72000, serviceAmount: 130000, totalAmount: 2947000, paidAmount: 2028500, remainingAmount: 918500, dueDate: '2026-09-05', status: 'unpaid' },
    { id: 'HD-IV-00078', code: 'HD-IV-00078', period: '2026-10', periodLabel: 'Tháng 10/2026', roomId: 'P303', roomName: 'Phòng P303', building: 'Nhà trọ Bình An', tenantId: 'KH-00022', tenantName: 'Lương Văn Tùng', tenantPhone: '0916808935', rentAmount: 2500000, oldElec: 890, newElec: 960, elecUsage: 70, elecAmount: 245000, oldWater: 33, newWater: 37, waterUsage: 4, waterAmount: 72000, serviceAmount: 130000, totalAmount: 2947000, paidAmount: 0, remainingAmount: 2947000, dueDate: '2026-10-05', status: 'unpaid' },
    { id: 'HD-IV-00097', code: 'HD-IV-00097', period: '2026-11', periodLabel: 'Tháng 11/2026', roomId: 'P303', roomName: 'Phòng P303', building: 'Nhà trọ Bình An', tenantId: 'KH-00022', tenantName: 'Lương Văn Tùng', tenantPhone: '0916808935', rentAmount: 2500000, oldElec: 960, newElec: 1030, elecUsage: 70, elecAmount: 245000, oldWater: 37, newWater: 41, waterUsage: 4, waterAmount: 72000, serviceAmount: 130000, totalAmount: 2947000, paidAmount: 0, remainingAmount: 2947000, dueDate: '2026-11-05', status: 'unpaid' }
  ];

  var transactions = [
    { id: 'TX-001', code: 'PT-00031', date: '2026-10-16', type: 'expense', category: 'Sửa chữa & Bảo trì', title: 'Sửa chữa phòng — Phòng P204', roomId: 'P204', roomName: 'Phòng P204', building: 'Nhà trọ Bình An', amount: 1050000, paymentMethod: 'cash', fund: 'cash', note: 'Bảo trì máy lạnh và chống thấm tường P204' },
    { id: 'TX-002', code: 'PT-00030', date: '2026-09-25', type: 'income', category: 'Thu tiền phòng', title: 'Thu tiền hóa đơn HD-IV-00055 — Phòng P104', roomId: 'P104', roomName: 'Phòng P104', tenantName: 'Đặng Văn Khoa', building: 'Nhà trọ Bình An', amount: 3300000, paymentMethod: 'transfer', fund: 'bank', invoiceCode: 'HD-IV-00055' }
  ];

  return {
    rooms: rooms,
    tenants: tenants,
    vehicles: vehicles,
    contracts: contracts,
    invoices: invoices,
    transactions: transactions,
    activities: []
  };
}
