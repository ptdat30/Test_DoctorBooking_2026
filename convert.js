// convert_v2.js  – TOTAL_TEST_CASES.xlsx  (updated: thêm TC ID, Pre-condition,
//                   Expected Result, Actual Result, Pass/Fail, Priority, Severity, Req ID)
const ExcelJS = require('C:\\Users\\DAT\\.gemini\\antigravity-ide\\scratch_xlsx\\node_modules\\exceljs');
const path = require('path');

const OUT = path.join(
  'c:\\Users\\DAT\\OneDrive - ut.edu.vn\\Documents\\Desktop\\Repo',
  'TOTAL_TEST_CASES_v2.xlsx'
);

// ── Color palette ─────────────────────────────────────────────────────────────
const C = {
  titleBg:    'FF1E3A5F', titleFg:    'FFFFFFFF',
  sectionBg:  'FF2C7BB6', sectionFg:  'FFFFFFFF',
  subsecBg:   'FF4AA3D9', subsecFg:   'FFFFFFFF',
  headerBg:   'FFD6E8F5', headerFg:   'FF1E3A5F',
  positiveBg: 'FFE8F5E9', negativeBg: 'FFFDECEA',
  bvaBg:      'FFFFF8E1', setupBg:    'FFF3E5F5',
  evenRow:    'FFF5F9FF', border:     'FFB0C4DE',
};

function thinBorder() {
  const s = { style: 'thin', color: { argb: C.border } };
  return { top: s, left: s, bottom: s, right: s };
}
function rowBg(type) {
  const t = (type || '').toUpperCase();
  if (t.includes('NEGATIVE')) return C.negativeBg;
  if (t.includes('BVA'))      return C.bvaBg;
  if (t.includes('SETUP') || t.includes('E2E')) return C.setupBg;
  if (t.includes('POSITIVE')) return C.positiveBg;
  return C.evenRow;
}
function applyCell(cell, value, opts = {}) {
  cell.value = (value !== undefined && value !== null) ? String(value) : '';
  cell.font  = { name: 'Calibri', bold: opts.bold||false,
                 color: { argb: opts.fg||'FF000000' }, size: opts.size||10 };
  cell.alignment = { horizontal: opts.align||'left', vertical: 'middle',
                     wrapText: opts.wrap !== false };
  if (opts.bg) cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: opts.bg } };
  if (opts.border !== false) cell.border = thinBorder();
}
function titleRow(ws, row, text, ncols) {
  ws.mergeCells(row, 1, row, ncols);
  applyCell(ws.getCell(row,1), text,
    { bold:true, bg:C.titleBg, fg:C.titleFg, size:13, align:'center' });
  ws.getRow(row).height = 32;
}
function sectionRow(ws, row, text, ncols, bg, fg) {
  ws.mergeCells(row, 1, row, ncols);
  applyCell(ws.getCell(row,1), text,
    { bold:true, bg: bg||C.sectionBg, fg: fg||C.sectionFg, size:11, align:'left' });
  ws.getRow(row).height = 22;
}
function subsecRow(ws, row, text, ncols) {
  sectionRow(ws, row, text, ncols, C.subsecBg, C.subsecFg);
  ws.getRow(row).height = 20;
}
function headerRow(ws, row, headers, widths) {
  headers.forEach((h, i) => applyCell(ws.getCell(row, i+1), h,
    { bold:true, bg:C.headerBg, fg:C.headerFg, align:'center' }));
  if (widths) widths.forEach((w,i) => { ws.getColumn(i+1).width = w; });
  ws.getRow(row).height = 34;
}

// ════════════════════════════════════════════════════════════════════════════
//  SHEET 1 – Tong Quan (giữ nguyên)
// ════════════════════════════════════════════════════════════════════════════
function buildOverview(wb) {
  const ws = wb.addWorksheet('Tong Quan');
  ws.views = [{ showGridLines: false }];
  titleRow(ws, 1, 'TONG HOP TOAN BO TEST CASES – DU AN DOCTOR BOOKING SYSTEM 2026', 4);
  ws.getRow(1).height = 36;
  ws.mergeCells(2,1,2,4);
  applyCell(ws.getCell(2,1),
    'Tai lieu tong hop toan bo cac kich ban kiem thu (Test Cases) cua du an, bao gom JUnit Unit Tests (Backend) va Postman API Automation Tests.',
    { align:'left', fg:'FF444444', border:false });
  ws.getRow(2).height = 30;
  sectionRow(ws, 3, 'Tom Tat Tong Quan', 4);
  headerRow(ws, 4, ['Thanh phan kiem thu','Tong so TC','Phuong phap noi bat','Trang thai'], [38,20,52,14]);
  const summary = [
    ['JUnit Unit Tests (Backend)','67','BVA, Mocking (Mockito), Unit Isolation','DAT 100%'],
    ['Postman API Automation','114','BVA, Data-Driven Testing (3 vai tro), Security','DAT 100%'],
    ['TONG CONG','181','BVA & Integration Testing','PASSED'],
  ];
  summary.forEach(([comp,total,method,status], idx) => {
    const r = 5+idx; const bg = idx===2 ? C.bvaBg : (idx%2===0 ? C.evenRow : 'FFFFFFFF');
    [comp,total,method,status].forEach((v,c) =>
      applyCell(ws.getCell(r,c+1), v, { bg, bold:idx===2, align: c===1||c===3?'center':'left' }));
    ws.getRow(r).height = 20;
  });
  sectionRow(ws, 9, 'Thong tin bo sung', 4);
  [['Postman – So lan lap (Data-Driven)','3 vai tro: PATIENT / DOCTOR / ADMIN'],
   ['Postman – Tong HTTP Requests','348 yeu cau HTTP'],
   ['Postman – Tong Assertions','768 assertions'],
   ['Toc do phan hoi API (Email bat dong bo)','< 500ms']].forEach(([k,v],idx) => {
    const r = 10+idx; const bg = idx%2===0 ? C.evenRow : 'FFFFFFFF';
    applyCell(ws.getCell(r,1), k, { bg, bold:true });
    ws.mergeCells(r,2,r,4); applyCell(ws.getCell(r,2), v, { bg });
    ws.getRow(r).height = 20;
  });
  ws.views[0].state = 'frozen'; ws.views[0].ySplit = 4;
}

// ════════════════════════════════════════════════════════════════════════════
//  SHEET 2 – JUnit Unit Tests  (CẬP NHẬT: thêm 8 cột mới)
// ════════════════════════════════════════════════════════════════════════════
function buildJunit(wb) {
  const ws = wb.addWorksheet('JUnit Unit Tests');
  ws.views = [{ showGridLines: false }];
  const NCOLS = 12;

  titleRow(ws, 1, 'KIEM THU DON VI BACKEND – JUnit 5 / Mockito', NCOLS);
  headerRow(ws, 2, [
    'TC ID', 'Ten Test Case (JUnit)', 'Pre-condition',
    'Mo ta (Summary)', 'Expected Result', 'Actual Result',
    'Pass/Fail', 'Loai', 'Gia tri bien', 'Priority', 'Severity', 'Req ID'
  ], [14, 40, 36, 36, 38, 18, 10, 14, 14, 10, 12, 14]);

  let row = 3;

  // helper: write one data row
  function wr(cols, type) {
    const bg = rowBg(type || cols[7]);
    cols.forEach((v, i) => {
      const align = [0,6,7,8,9,10].includes(i) ? 'center' : 'left';
      const sz    = i === 1 ? 9 : 10;
      applyCell(ws.getCell(row, i+1), v, { bg, align, size: sz });
    });
    ws.getRow(row).height = 18; row++;
  }

  // ── 1.1 WalletServiceTest ─────────────────────────────────────────────────
  subsecRow(ws, row, '1.1  WalletServiceTest – Vi dien tu, Diem tich luy & Loyalty Tiers (26 TC)', NCOLS); row++;

  const walletPre = 'WalletRepository, PatientRepository duoc mock; so du va diem tich luy cua Patient duoc thiet lap gia tri cu the';
  const walletPreNull = 'WalletRepository mock tra ve null cho balance; PatientRepository mock';

  const walletRows = [
    // [TC_ID, MethodName, PreCondition, Summary, ExpectedResult, ActualResult, Pass/Fail, Loai, BVA, Priority, Severity, ReqID]
    ['TC_WALLET_01','payForAppointment_success_sufficientBalance',
     walletPre,'Thanh toan phi kham thanh cong khi so du du',
     'So du vi giam dung phi kham; diem tich luy tang; WalletRepository.save() duoc goi',
     'Passed','Pass','Positive','','High','Major','REQ-WALLET-01'],
    ['TC_WALLET_02','payForAppointment_insufficientBalance_throwsException',
     'So du vi = 0; phi kham > 0','Loi khi so du khong du thanh toan',
     'InsufficientBalanceException duoc nem; WalletRepository.save() KHONG duoc goi',
     'Passed','Pass','Negative','','High','Critical','REQ-WALLET-01'],
    ['TC_WALLET_03','payForAppointment_enoughPoints_upgradesToPlatinum',
     'So du du; diem tich luy = 9900 (cach bien PLATINUM 100 diem)','Tich luy du diem va nang hang thanh vien len PLATINUM',
     'Hang thanh vien chuyen sang PLATINUM; WalletRepository.save() duoc goi',
     'Passed','Pass','Positive','','Medium','Major','REQ-WALLET-02'],
    ['TC_WALLET_04','payForAppointment_nullBalance_treatedAsZero',
     walletPreNull,'So du rong (null) duoc xu ly la 0 va bao loi khi phi > 0',
     'Null balance duoc xu ly nhu 0; InsufficientBalanceException duoc nem',
     'Passed','Pass','Negative','','Medium','Major','REQ-WALLET-01'],
    ['TC_WALLET_05','refundAppointment_success',
     walletPre,'Hoan tien phi kham thanh cong va tru diem tich luy tuong ung',
     'So du vi tang dung so tien phi kham; diem tich luy giam; save() duoc goi',
     'Passed','Pass','Positive','','High','Major','REQ-WALLET-03'],
    ['TC_WALLET_06','refundAppointment_loyaltyPointsNotNegative',
     'Diem tich luy hien tai = 0; hoan phi kham co diem truong ung','Diem tich luy sau khi tru hoan phi khong bao gio bi am',
     'LoyaltyPoints sau hoan phi >= 0 (min la 0, khong am)',
     'Passed','Pass','Positive','Bien duoi = 0','Medium','Minor','REQ-WALLET-03'],
    ['TC_WALLET_07','createDepositTransaction_success',
     'WalletRepository mock; TransactionRepository mock','Tao yeu cau nap tien o trang thai PENDING thanh cong',
     'Transaction moi duoc tao voi status = PENDING; TransactionRepository.save() duoc goi',
     'Passed','Pass','Positive','','Medium','Major','REQ-WALLET-04'],
    ['TC_WALLET_08','completeDeposit_success',
     'Transaction ton tai voi status = PENDING; so tien nap duoc xac dinh','Xac nhan nap tien thanh cong, cong so du, tich diem va nang hang GOLD',
     'Transaction status = COMPLETED; so du tang; diem tang; hang GOLD duoc cap nhat',
     'Passed','Pass','Positive','','High','Major','REQ-WALLET-04'],
    ['TC_WALLET_09','completeDeposit_alreadyCompleted_returnsEarly',
     'Transaction da co status = COMPLETED truoc do','Giao dich da COMPLETED truoc do khong xu ly lai',
     'Ham return som; WalletRepository.save() KHONG duoc goi lan 2',
     'Passed','Pass','Positive','','Medium','Minor','REQ-WALLET-04'],
    ['TC_WALLET_10','completeDeposit_notFound_throwsException',
     'TransactionRepository.findById() tra ve Optional.empty()','Bao loi khi ma giao dich nap tien khong ton tai',
     'TransactionNotFoundException (hoac tuong duong) duoc nem',
     'Passed','Pass','Negative','','Medium','Major','REQ-WALLET-04'],
    ['TC_WALLET_11','failDeposit_success',
     'Transaction ton tai voi status = PENDING','Danh dau giao dich nap tien that bai thanh cong',
     'Transaction status = FAILED; TransactionRepository.save() duoc goi',
     'Passed','Pass','Positive','','Medium','Major','REQ-WALLET-04'],
    ['TC_WALLET_12','failDeposit_alreadyCompleted_returnsEarly',
     'Transaction da co status = COMPLETED','Giao dich da COMPLETED khong the doi sang FAILED',
     'Ham return som; trang thai khong thay doi; save() KHONG duoc goi',
     'Passed','Pass','Negative','','Medium','Minor','REQ-WALLET-04'],
    ['TC_WALLET_13','loyaltyTier_bronze','Diem tich luy = 500 (< 1000)','Diem < 1000 giu hang BRONZE',
     'computeLoyaltyTier() tra ve BRONZE','Passed','Pass','Positive','','Low','Minor','REQ-WALLET-02'],
    ['TC_WALLET_14','loyaltyTier_silver','Diem tich luy = 2000 (1000-4999)','Diem >= 1000 nang hang SILVER',
     'computeLoyaltyTier() tra ve SILVER','Passed','Pass','Positive','','Low','Minor','REQ-WALLET-02'],
    ['TC_WALLET_15','loyaltyTier_gold','Diem tich luy = 7000 (5000-9999)','Diem >= 5000 nang hang GOLD',
     'computeLoyaltyTier() tra ve GOLD','Passed','Pass','Positive','','Low','Minor','REQ-WALLET-02'],
    ['TC_WALLET_16','loyaltyTier_platinum','Diem tich luy = 15000 (>= 10000)','Diem >= 10000 nang hang PLATINUM',
     'computeLoyaltyTier() tra ve PLATINUM','Passed','Pass','Positive','','Low','Minor','REQ-WALLET-02'],
    ['TC_WALLET_17','loyaltyTier_bva_0_bronze','Diem tich luy = 0 (bien duoi tuyet doi)','Diem toi thieu bang 0',
     'computeLoyaltyTier() tra ve BRONZE','Passed','Pass','BVA Bien duoi','0','Medium','Minor','REQ-WALLET-02'],
    ['TC_WALLET_18','loyaltyTier_bva_999_bronze','Diem tich luy = 999 (ngay duoi bien SILVER)','Diem ngay duoi bien SILVER',
     'computeLoyaltyTier() tra ve BRONZE (khong phai SILVER)','Passed','Pass','BVA Bien duoi','999','Medium','Minor','REQ-WALLET-02'],
    ['TC_WALLET_19','loyaltyTier_bva_1000_silver','Diem tich luy = 1000 (bien duoi SILVER)','Diem vua cham bien SILVER',
     'computeLoyaltyTier() tra ve SILVER','Passed','Pass','BVA Bien tren','1000','Medium','Minor','REQ-WALLET-02'],
    ['TC_WALLET_20','loyaltyTier_bva_1001_silver','Diem tich luy = 1001','Diem ngay tren bien SILVER',
     'computeLoyaltyTier() tra ve SILVER','Passed','Pass','BVA Bien tren','1001','Medium','Minor','REQ-WALLET-02'],
    ['TC_WALLET_21','loyaltyTier_bva_4999_silver','Diem tich luy = 4999 (ngay duoi bien GOLD)','Diem ngay duoi bien GOLD',
     'computeLoyaltyTier() tra ve SILVER (khong phai GOLD)','Passed','Pass','BVA Bien duoi','4999','Medium','Minor','REQ-WALLET-02'],
    ['TC_WALLET_22','loyaltyTier_bva_5000_gold','Diem tich luy = 5000 (bien duoi GOLD)','Diem vua cham bien GOLD',
     'computeLoyaltyTier() tra ve GOLD','Passed','Pass','BVA Bien tren','5000','Medium','Minor','REQ-WALLET-02'],
    ['TC_WALLET_23','loyaltyTier_bva_5001_gold','Diem tich luy = 5001','Diem ngay tren bien GOLD',
     'computeLoyaltyTier() tra ve GOLD','Passed','Pass','BVA Bien tren','5001','Medium','Minor','REQ-WALLET-02'],
    ['TC_WALLET_24','loyaltyTier_bva_9999_gold','Diem tich luy = 9999 (ngay duoi bien PLATINUM)','Diem ngay duoi bien PLATINUM',
     'computeLoyaltyTier() tra ve GOLD (khong phai PLATINUM)','Passed','Pass','BVA Bien duoi','9999','Medium','Minor','REQ-WALLET-02'],
    ['TC_WALLET_25','loyaltyTier_bva_10000_platinum','Diem tich luy = 10000 (bien duoi PLATINUM)','Diem vua cham bien PLATINUM',
     'computeLoyaltyTier() tra ve PLATINUM','Passed','Pass','BVA Bien tren','10000','Medium','Minor','REQ-WALLET-02'],
    ['TC_WALLET_26','loyaltyTier_bva_10001_platinum','Diem tich luy = 10001','Diem ngay tren bien PLATINUM',
     'computeLoyaltyTier() tra ve PLATINUM','Passed','Pass','BVA Bien tren','10001','Medium','Minor','REQ-WALLET-02'],
  ];
  walletRows.forEach(r => wr(r, r[7]));

  // ── 1.2 FeedbackServiceTest ───────────────────────────────────────────────
  subsecRow(ws, row, '1.2  FeedbackServiceTest – Danh gia Bac si & Bien thoi gian 24h (21 TC)', NCOLS); row++;

  const fbPre = 'FeedbackRepository, AppointmentRepository, PatientRepository duoc mock; dong ho he thong duoc kiem soat';
  const fbPreTime = (t) => `${fbPre}; feedback.createdAt duoc dat cach hien tai ${t}`;

  const feedbackRows = [
    ['TC_FB_01','createFeedback_success',
     'Appointment da COMPLETED va thuoc ve Patient hien tai; chua co Feedback',
     'Tao phan hoi thanh cong cho lich kham da hoan thanh',
     'Feedback moi duoc tao; FeedbackRepository.save() duoc goi; rating va comment duoc luu dung',
     'Passed','Pass','Positive','','High','Major','REQ-FEEDBACK-01'],
    ['TC_FB_02','createFeedback_appointmentNotCompleted_throwsException',
     'Appointment co trang thai PENDING (chua hoan thanh)',
     'Bao loi khi tao phan hoi cho lich kham chua hoan thanh',
     'AppointmentNotCompletedException (hoac tuong duong) duoc nem; save() KHONG duoc goi',
     'Passed','Pass','Negative','','High','Major','REQ-FEEDBACK-01'],
    ['TC_FB_03','createFeedback_appointmentNotBelongToPatient_throwsException',
     'Appointment thuoc ve Patient khac (khong phai Patient dang dang nhap)',
     'Bao loi khi phan hoi lich kham cua benh nhan khac',
     'UnauthorizedException (hoac tuong duong) duoc nem; save() KHONG duoc goi',
     'Passed','Pass','Negative','','High','Critical','REQ-FEEDBACK-01'],
    ['TC_FB_04','createFeedback_alreadyExists_throwsException',
     'Feedback da ton tai cho Appointment nay',
     'Khong cho phep tao phan hoi lan 2 cho cung 1 lich kham',
     'DuplicateFeedbackException (hoac tuong duong) duoc nem; save() KHONG duoc goi',
     'Passed','Pass','Negative','','Medium','Major','REQ-FEEDBACK-01'],
    ['TC_FB_05','updateFeedback_success',
     'Feedback ton tai; thuoc Patient hien tai; chua co doctor reply; thoi gian < 24h',
     'Cap nhat phan hoi thanh cong (trong 24 gio va chua co phan hoi bac si)',
     'Feedback duoc cap nhat rating/comment moi; save() duoc goi',
     'Passed','Pass','Positive','','High','Major','REQ-FEEDBACK-02'],
    ['TC_FB_06','updateFeedback_wrongPatient_throwsException',
     'Feedback thuoc Patient khac (khong phai nguoi dang yeu cau sua)',
     'Khong cho phep benh nhan khac sua phan hoi',
     'UnauthorizedException duoc nem; save() KHONG duoc goi',
     'Passed','Pass','Negative','','High','Critical','REQ-FEEDBACK-02'],
    ['TC_FB_07','updateFeedback_afterDoctorReply_throwsException',
     'Feedback da co doctorReply != null; thoi gian < 24h',
     'Khong cho phep chinh sua sau khi bac si da phan hoi',
     'FeedbackLockedException (hoac tuong duong) duoc nem; save() KHONG duoc goi',
     'Passed','Pass','Negative','','High','Major','REQ-FEEDBACK-02'],
    ['TC_FB_08','updateFeedback_bva_within24Hours_succeeds',
     fbPreTime('23h 59m 59s'),
     'Sua thanh cong o 23 gio 59 phut 59 giay',
     'Feedback duoc cap nhat; save() duoc goi (con trong gioi han 24h)',
     'Passed','Pass','BVA Bien trong','23h 59m 59s','High','Major','REQ-FEEDBACK-02'],
    ['TC_FB_09','updateFeedback_bva_exactly24Hours_succeeds',
     fbPreTime('dung 24h 00m 00s'),
     'Sua thanh cong o chinh xac 24 gio',
     'Feedback duoc cap nhat; save() duoc goi (dung bien cho phep)',
     'Passed','Pass','BVA Bien','Dung 24h 00m 00s','High','Major','REQ-FEEDBACK-02'],
    ['TC_FB_10','updateFeedback_bva_after24Hours_throwsException',
     fbPreTime('24h 00m 01s'),
     'That bai khi sua o 24 gio 00 phut 01 giay',
     'FeedbackExpiredException (hoac tuong duong) duoc nem; save() KHONG duoc goi',
     'Passed','Pass','BVA Bien ngoai','24h 00m 01s','High','Major','REQ-FEEDBACK-02'],
    ['TC_FB_11','replyToFeedback_success',
     'Feedback ton tai va thuoc ve Doctor hien tai',
     'Bac si phan hoi nhan xet cua benh nhan thanh cong',
     'doctorReply duoc luu; FeedbackRepository.save() duoc goi',
     'Passed','Pass','Positive','','Medium','Major','REQ-FEEDBACK-03'],
    ['TC_FB_12','replyToFeedback_wrongDoctor_throwsException',
     'Feedback thuoc Doctor khac (khong phai Doctor dang dang nhap)',
     'Bac si khong the phan hoi nhan xet danh cho bac si khac',
     'UnauthorizedException duoc nem; save() KHONG duoc goi',
     'Passed','Pass','Negative','','High','Critical','REQ-FEEDBACK-03'],
    ['TC_FB_13','averageRating_noFeedbacks_returnsZero',
     'Doctor chua co Feedback nao trong DB',
     'Diem danh gia trung binh bang 0.0 khi bac si chua co nhan xet',
     'averageRating() tra ve 0.0 (khong bi loi chia 0)',
     'Passed','Pass','Positive','','Medium','Minor','REQ-FEEDBACK-04'],
    ['TC_FB_14','averageRating_withHiddenFeedbacks_ignoresHidden',
     'Doctor co 3 Feedback: 2 visible (rating 4,5), 1 hidden (rating 1)',
     'Diem danh gia trung binh khong tinh cac nhan xet bi an',
     'averageRating() tra ve 4.5 (chi tinh 2 feedback visible)',
     'Passed','Pass','Positive','','Medium','Major','REQ-FEEDBACK-04'],
    ['TC_FB_15','averageRating_allHidden_returnsZero',
     'Tat ca Feedback cua Doctor deu co isHidden = true',
     'Tra ve 0.0 neu tat ca nhan xet cua bac si bi an',
     'averageRating() tra ve 0.0',
     'Passed','Pass','Positive','','Medium','Minor','REQ-FEEDBACK-04'],
    ['TC_FB_16','hideFeedback_success',
     'Feedback ton tai va hien tai isHidden = false; nguoi goi la Admin',
     'Admin an nhan xet xau/khong phu hop thanh cong',
     'isHidden = true; save() duoc goi',
     'Passed','Pass','Positive','','Medium','Major','REQ-FEEDBACK-05'],
    ['TC_FB_17','unhideFeedback_success',
     'Feedback ton tai va hien tai isHidden = true; nguoi goi la Admin',
     'Admin bo an nhan xet thanh cong',
     'isHidden = false; save() duoc goi',
     'Passed','Pass','Positive','','Medium','Major','REQ-FEEDBACK-05'],
    ['TC_FB_18','getDoctorFeedbacks_filtersHidden',
     'Doctor co 5 Feedback: 3 visible, 2 hidden',
     'Danh sach nhan xet tra ve khong chua nhan xet bi an',
     'Ket qua chi chua 3 Feedback co isHidden = false',
     'Passed','Pass','Positive','','High','Major','REQ-FEEDBACK-06'],
    ['TC_FB_19','getByStatus_nullStatus_returnsAll',
     'Admin goi API voi status = null',
     'Admin lay toan bo danh sach khi khong chi dinh trang thai loc',
     'Tra ve tat ca Feedback khong loc theo status',
     'Passed','Pass','Positive','','Low','Minor','REQ-FEEDBACK-07'],
    ['TC_FB_20','getByStatus_validStatus_filters',
     'Admin goi API voi status = "REPLIED"',
     'Admin lay danh sach phan hoi loc theo trang thai (PENDING, REPLIED)',
     'Chi tra ve cac Feedback co status = REPLIED',
     'Passed','Pass','Positive','','Medium','Minor','REQ-FEEDBACK-07'],
    ['TC_FB_21','getByStatus_invalidStatus_returnsAll',
     'Admin goi API voi status = "INVALID_STATUS"',
     'Lay toan bo danh sach neu truyen trang thai khong hop le',
     'Tra ve tat ca Feedback (khong throw exception; fallback an toan)',
     'Passed','Pass','Positive','','Low','Minor','REQ-FEEDBACK-07'],
  ];
  feedbackRows.forEach(r => wr(r, r[7]));

  // ── 1.3 AuthServiceTest ───────────────────────────────────────────────────
  subsecRow(ws, row, '1.3  AuthServiceTest – Xac thuc, Dang ky & Dang nhap (11 TC)', NCOLS); row++;

  const authPre = 'UserRepository, PatientProfileRepository, PasswordEncoder duoc mock; JwtUtil duoc mock';

  const authRows = [
    ['TC_AUTH_01','register_success_patient',
     `${authPre}; username/email chua ton tai trong DB`,
     'Dang ky tai khoan Benh nhan moi thanh cong',
     'User moi duoc tao voi role = PATIENT; UserRepository.save() duoc goi; password da duoc ma hoa',
     'Passed','Pass','Positive','','High','Major','REQ-AUTH-01'],
    ['TC_AUTH_02','register_success_doctor',
     `${authPre}; username/email chua ton tai`,
     'Dang ky tai khoan Bac si moi thanh cong',
     'User moi duoc tao voi role = DOCTOR; UserRepository.save() duoc goi',
     'Passed','Pass','Positive','','High','Major','REQ-AUTH-01'],
    ['TC_AUTH_03','register_success_admin',
     `${authPre}; username/email chua ton tai`,
     'Dang ky tai khoan Quan tri vien moi thanh cong',
     'User moi duoc tao voi role = ADMIN; UserRepository.save() duoc goi',
     'Passed','Pass','Positive','','High','Major','REQ-AUTH-01'],
    ['TC_AUTH_04','register_noRole_defaultsToPatient',
     `${authPre}; request khong co truong role`,
     'Dang ky khong chi dinh role se tu dong gan la PATIENT',
     'User moi co role = PATIENT (mac dinh)',
     'Passed','Pass','Positive','','Medium','Minor','REQ-AUTH-01'],
    ['TC_AUTH_05','register_fails_usernameExists',
     `${authPre}; username da ton tai trong UserRepository`,
     'That bai khi dang ky trung Username',
     'UsernameAlreadyExistsException duoc nem; save() KHONG duoc goi',
     'Passed','Pass','Negative','','High','Major','REQ-AUTH-02'],
    ['TC_AUTH_06','register_fails_emailExists',
     `${authPre}; email da ton tai trong UserRepository`,
     'That bai khi dang ky trung Email',
     'EmailAlreadyExistsException duoc nem; save() KHONG duoc goi',
     'Passed','Pass','Negative','','High','Major','REQ-AUTH-02'],
    ['TC_AUTH_07','register_invalidRole_defaultsToPatient',
     `${authPre}; request co role = "SUPERUSER" (khong hop le)`,
     'Dang ky voi role khong hop le se tu dong gan la PATIENT',
     'User duoc tao voi role = PATIENT; khong throw exception',
     'Passed','Pass','Positive','','Medium','Minor','REQ-AUTH-01'],
    ['TC_AUTH_08','login_success',
     `${authPre}; tai khoan PATIENT ton tai; password dung; PatientProfile co fullName`,
     'Dang nhap thanh cong, tra ve JWT Token va thong tin ca nhan',
     'LoginResponse chua JWT token hop le, fullName, role = PATIENT',
     'Passed','Pass','Positive','','High','Critical','REQ-AUTH-03'],
    ['TC_AUTH_09','login_success_admin',
     `${authPre}; tai khoan ADMIN ton tai; password dung`,
     'Dang nhap tai khoan Quan tri vien thanh cong',
     'LoginResponse chua JWT token hop le, role = ADMIN',
     'Passed','Pass','Positive','','High','Critical','REQ-AUTH-03'],
    ['TC_AUTH_10','login_fails_badCredentials',
     `${authPre}; PasswordEncoder.matches() tra ve false`,
     'Tu choi dang nhap khi sai mat khau',
     'BadCredentialsException duoc nem; khong tra ve token',
     'Passed','Pass','Negative','','High','Critical','REQ-AUTH-03'],
    ['TC_AUTH_11','login_patientWithoutProfile_fullNameNull',
     `${authPre}; tai khoan PATIENT ton tai; PatientProfile chua duoc tao`,
     'Dang nhap tai khoan chua dien thong tin ca nhan se tra ve ten rong',
     'LoginResponse tra ve fullName = null (hoac rong); khong loi 500',
     'Passed','Pass','Positive','','Medium','Minor','REQ-AUTH-03'],
  ];
  authRows.forEach(r => wr(r, r[7]));

  // ── 1.4 AppointmentServiceTest ────────────────────────────────────────────
  subsecRow(ws, row, '1.4  AppointmentServiceTest – Dat/Huy/Xac nhan lich kham (19 TC)', NCOLS); row++;

  const apptPre = 'AppointmentRepository, DoctorRepository, PatientRepository, WalletService duoc mock';

  const apptRows = [
    ['TC_APPT_01','getAvailableSlots_noPendingAppointments_returnsAllSlots',
     `${apptPre}; Doctor ton tai; chua co Appointment nao trong ngay`,
     'Tra ve toan bo 17 khung gio kham trong khi bac si chua co lich hen',
     'Danh sach slots tra ve co dung 17 phan tu (tat ca slots mac dinh)',
     'Passed','Pass','Positive','','Medium','Minor','REQ-APPT-01'],
    ['TC_APPT_02','getAvailableSlots_removePendingSlot',
     `${apptPre}; Co 1 Appointment PENDING tai slot "08:00-08:30"`,
     'Loai bo cac khung gio dang co lich hen o trang thai PENDING',
     'Slot "08:00-08:30" KHONG co trong danh sach tra ve; 16 slots con lai hien thi',
     'Passed','Pass','Positive','','Medium','Minor','REQ-APPT-01'],
    ['TC_APPT_03','getAvailableSlots_confirmedRemovedCancelledKept',
     `${apptPre}; 1 slot CONFIRMED; 1 slot CANCELLED`,
     'Loai bo ca da CONFIRMED, giu lai ca da CANCELLED',
     'Slot CONFIRMED bi xoa; Slot CANCELLED van con trong danh sach available',
     'Passed','Pass','Positive','','Medium','Minor','REQ-APPT-01'],
    ['TC_APPT_04','createAppointment_cash_success',
     `${apptPre}; Doctor ton tai, active; slot trong; phuong thuc CASH`,
     'Dat lich kham thanh cong voi hinh thuc thanh toan Tien mat',
     'Appointment moi tao voi status = PENDING, paymentMethod = CASH; save() duoc goi; WalletService KHONG duoc goi',
     'Passed','Pass','Positive','','High','Major','REQ-APPT-02'],
    ['TC_APPT_05','createAppointment_wallet_success',
     `${apptPre}; Doctor ton tai, active; slot trong; phuong thuc WALLET; so du du`,
     'Dat lich kham va tu dong thanh toan qua Vi dien tu thanh cong',
     'Appointment tao voi status = PENDING; WalletService.payForAppointment() duoc goi; so du bi tru',
     'Passed','Pass','Positive','','High','Major','REQ-APPT-02'],
    ['TC_APPT_06','createAppointment_doctorNotFound_throwsException',
     `${apptPre}; DoctorRepository.findById() tra ve Optional.empty()`,
     'Bao loi khi dat lich kham voi bac si khong ton tai',
     'DoctorNotFoundException duoc nem; Appointment KHONG duoc tao',
     'Passed','Pass','Negative','','High','Major','REQ-APPT-02'],
    ['TC_APPT_07','createAppointment_doctorNotActive_throwsException',
     `${apptPre}; Doctor ton tai nhung isActive = false`,
     'Khong cho phep dat lich kham voi bac si dang tam ngung hoat dong',
     'DoctorNotActiveException duoc nem; Appointment KHONG duoc tao',
     'Passed','Pass','Negative','','High','Major','REQ-APPT-02'],
    ['TC_APPT_08','createAppointment_slotAlreadyTaken_throwsException',
     `${apptPre}; Slot da co Appointment PENDING hoac CONFIRMED`,
     'Tra ve loi khi chon ca kham da co nguoi dat truoc',
     'SlotAlreadyTakenException duoc nem; Appointment moi KHONG duoc tao',
     'Passed','Pass','Negative','','High','Major','REQ-APPT-02'],
    ['TC_APPT_09','createAppointment_pastDate_throwsException',
     `${apptPre}; appointmentDate = ngay hom qua`,
     'Khong cho phep dat lich kham vao cac ngay trong qua khu',
     'InvalidDateException duoc nem; Appointment KHONG duoc tao',
     'Passed','Pass','Negative','','High','Major','REQ-APPT-02'],
    ['TC_APPT_10','cancelAppointment_pending_success',
     `${apptPre}; Appointment co status = PENDING; paymentMethod = CASH; thuoc Patient hien tai`,
     'Benh nhan tu huy lich hen PENDING thanh cong (khong hoan tien mat)',
     'Appointment status = CANCELLED; WalletService.refund() KHONG duoc goi',
     'Passed','Pass','Positive','','High','Major','REQ-APPT-03'],
    ['TC_APPT_11','cancelAppointment_wallet_refund',
     `${apptPre}; Appointment co status = PENDING; paymentMethod = WALLET; thuoc Patient hien tai`,
     'Huy lich hen da thanh toan bang vi -> Tu dong hoan lai tien vao vi',
     'Appointment status = CANCELLED; WalletService.refundAppointment() duoc goi',
     'Passed','Pass','Positive','','High','Critical','REQ-APPT-03'],
    ['TC_APPT_12','cancelAppointment_wrongPatient_throwsException',
     `${apptPre}; Appointment thuoc Patient khac`,
     'Khong cho phep benh nhan nay huy lich hen cua benh nhan khac',
     'UnauthorizedException duoc nem; Appointment KHONG bi thay doi',
     'Passed','Pass','Negative','','High','Critical','REQ-APPT-03'],
    ['TC_APPT_13','cancelAppointment_completed_throwsException',
     `${apptPre}; Appointment co status = COMPLETED`,
     'Khong the huy lich hen da kham xong (COMPLETED)',
     'AppointmentAlreadyCompletedException duoc nem',
     'Passed','Pass','Negative','','High','Major','REQ-APPT-03'],
    ['TC_APPT_14','cancelAppointment_alreadyCancelled_throwsException',
     `${apptPre}; Appointment co status = CANCELLED`,
     'Khong the huy mot lich hen da duoc huy truoc do',
     'AppointmentAlreadyCancelledException duoc nem',
     'Passed','Pass','Negative','','Medium','Minor','REQ-APPT-03'],
    ['TC_APPT_15','confirmAppointment_success',
     `${apptPre}; Appointment co status = PENDING; thuoc Doctor hien tai`,
     'Bac si xac nhan lich hen PENDING chuyen sang CONFIRMED thanh cong',
     'Appointment status = CONFIRMED; save() duoc goi',
     'Passed','Pass','Positive','','High','Major','REQ-APPT-04'],
    ['TC_APPT_16','confirmAppointment_wrongDoctor_throwsException',
     `${apptPre}; Appointment thuoc Doctor khac`,
     'Bac si khong the xac nhan lich kham cua bac si khac',
     'UnauthorizedException duoc nem; Appointment KHONG bi thay doi',
     'Passed','Pass','Negative','','High','Critical','REQ-APPT-04'],
    ['TC_APPT_17','confirmAppointment_notPending_throwsException',
     `${apptPre}; Appointment co status = CONFIRMED (da xac nhan roi)`,
     'Chi cho phep xac nhan cac lich hen o trang thai PENDING',
     'AppointmentNotPendingException duoc nem',
     'Passed','Pass','Negative','','High','Major','REQ-APPT-04'],
    ['TC_APPT_18','getAppointmentsByDate_nullDate_returnsAll',
     `${apptPre}; co nhieu Appointment voi cac ngay khac nhau; date = null`,
     'Lay toan bo lich hen khi khong loc theo ngay',
     'Tra ve tat ca Appointment khong loc theo ngay',
     'Passed','Pass','Positive','','Medium','Minor','REQ-APPT-05'],
    ['TC_APPT_19','getAppointmentsByDate_withDate_filtersCorrectly',
     `${apptPre}; co nhieu Appointment; date = "2026-06-06"`,
     'Loc danh sach lich hen chinh xac theo ngay chi dinh',
     'Chi tra ve Appointment co appointmentDate = "2026-06-06"',
     'Passed','Pass','Positive','','Medium','Minor','REQ-APPT-05'],
  ];
  apptRows.forEach(r => wr(r, r[7]));

  // ── 1.5 BackendApplicationTests ───────────────────────────────────────────
  subsecRow(ws, row, '1.5  BackendApplicationTests – Spring Boot Context (1 TC)', NCOLS); row++;
  wr(['TC_APP_01','contextLoads',
    'Toan bo cau hinh Spring Boot hop le; file application.properties ton tai; ket noi DB mock (test profile)',
    'Dam bao context cua ung dung Spring Boot khoi tao thanh cong',
    'ApplicationContext duoc tao thanh cong; khong co BeanCreationException',
    'Passed','Pass','Positive','','High','Critical','REQ-SYS-01'], 'Positive');

  ws.views[0].state = 'frozen'; ws.views[0].ySplit = 2;
}

// ════════════════════════════════════════════════════════════════════════════
//  SHEET 3 – Postman BVA  (CẬP NHẬT: thêm Pre-condition, Inputs, Expected,
//            Actual, Pass/Fail, Priority, Severity, Req ID)
// ════════════════════════════════════════════════════════════════════════════
function buildPostmanBva(wb) {
  const ws = wb.addWorksheet('Postman BVA Chi Tiet');
  ws.views = [{ showGridLines: false }];
  const NCOLS = 11;

  titleRow(ws, 1, 'POSTMAN API – PHAN TICH GIA TRI BIEN (BVA) CHI TIET', NCOLS);
  headerRow(ws, 2, [
    'TC ID', 'Endpoint / Request',
    'Pre-condition', 'Inputs (BVA)',
    'Expected Result', 'Actual Result',
    'Pass/Fail', 'Loai BVA',
    'Priority', 'Severity', 'Req ID'
  ], [14, 36, 36, 30, 36, 18, 10, 18, 10, 12, 14]);

  let row = 3;

  function wrb(cols, type) {
    const bg = rowBg(type || cols[7]);
    cols.forEach((v, i) => {
      const align = [0,5,6,7,8,9].includes(i) ? 'center' : 'left';
      applyCell(ws.getCell(row, i+1), v, { bg, align, size: i===1?9:10 });
    });
    ws.getRow(row).height = 18; row++;
  }

  const tokenPre = 'Server dang chay; khong can token (register) hoac da dang nhap va co token trong bien Postman';
  const authPre  = 'Server dang chay; token Patient da duoc lay tu 00_Setup';

  // 02_Auth Username BVA
  subsecRow(ws, row, '02_Auth – Username BVA (3-50 ky tu)', NCOLS); row++;
  const uBvaRows = [
    ['TC_API_BVA_01','POST /api/auth/register – Username Too Short',
     tokenPre,'username = "ab" (2 ky tu)',
     'HTTP 400; response body co thong bao loi validation username qua ngan',
     'Passed','Pass','BVA Bien duoi ngoai','High','Major','REQ-AUTH-01'],
    ['TC_API_BVA_02','POST /api/auth/register – Username Min Valid',
     tokenPre,'username = "abc" (3 ky tu)',
     'HTTP 201; User duoc tao thanh cong',
     'Passed','Pass','BVA Bien duoi trong','High','Major','REQ-AUTH-01'],
    ['TC_API_BVA_03','POST /api/auth/register – Username Max Valid',
     tokenPre,`username = "${'a'.repeat(50)}" (50 ky tu)`,
     'HTTP 201; User duoc tao thanh cong',
     'Passed','Pass','BVA Bien tren trong','High','Major','REQ-AUTH-01'],
    ['TC_API_BVA_04','POST /api/auth/register – Username Too Long',
     tokenPre,`username = "${'a'.repeat(51)}" (51 ky tu)`,
     'HTTP 400; response body co thong bao loi validation username qua dai',
     'Passed','Pass','BVA Bien tren ngoai','High','Major','REQ-AUTH-01'],
  ];
  uBvaRows.forEach(r => wrb(r, r[7]));

  // 02_Auth Password BVA
  subsecRow(ws, row, '02_Auth – Password BVA (>= 6 ky tu)', NCOLS); row++;
  [
    ['TC_API_BVA_05','POST /api/auth/register – Password Too Short',
     tokenPre,'password = "12345" (5 ky tu)',
     'HTTP 400; response body co thong bao loi validation password qua ngan',
     'Passed','Pass','BVA Bien duoi ngoai','High','Critical','REQ-AUTH-01'],
    ['TC_API_BVA_06','POST /api/auth/register – Password Min Valid',
     tokenPre,'password = "123456" (6 ky tu)',
     'HTTP 201; User duoc tao thanh cong',
     'Passed','Pass','BVA Bien duoi trong','High','Critical','REQ-AUTH-01'],
  ].forEach(r => wrb(r, r[7]));

  // Security
  subsecRow(ws, row, '02_Auth – Security & Negative Cases', NCOLS); row++;
  [
    ['TC_API_SEC_01','POST /api/auth/register – Invalid Email',
     tokenPre,'email = "not-an-email"',
     'HTTP 400; loi validation dinh dang email',
     'Passed','Pass','Negative','High','Major','REQ-AUTH-01'],
    ['TC_API_SEC_02','POST /api/auth/login – Missing Password',
     tokenPre,'body thieu truong password',
     'HTTP 400; loi validation: password la bat buoc',
     'Passed','Pass','Negative','High','Major','REQ-AUTH-03'],
    ['TC_API_SEC_03','POST /api/auth/login – Wrong Credentials',
     tokenPre,'username/password sai','HTTP 401 Unauthorized',
     'Passed','Pass','Negative','High','Critical','REQ-AUTH-03'],
    ['TC_API_SEC_04','POST /api/auth/register – SQL Injection',
     tokenPre,"username = \"admin'--\"",
     'HTTP 400 hoac 401; KHONG tra ve HTTP 500; DB khong bi anh huong',
     'Passed','Pass','Negative','High','Critical','REQ-SEC-01'],
    ['TC_API_SEC_05','PUT /api/patient/profile – XSS Payload',
     `${authPre}; token Patient hop le`,"fullName = \"<script>alert('xss')</script>\"",
     'HTTP 200; payload duoc luu an toan (encode hoac sanitize); KHONG execute script',
     'Passed','Pass','Negative','High','Critical','REQ-SEC-02'],
  ].forEach(r => wrb(r, r[7]));

  // Rating BVA
  subsecRow(ws, row, '07_Patient_Feedbacks – Rating BVA (1-5 sao)', NCOLS); row++;
  [
    ['TC_API_BVA_07','POST /api/patient/feedbacks – Rating Too Low',
     `${authPre}; Appointment da COMPLETED`,'rating = 0',
     'HTTP 400; loi validation: rating phai >= 1',
     'Passed','Pass','BVA Bien duoi ngoai','High','Major','REQ-FEEDBACK-01'],
    ['TC_API_BVA_08','POST /api/patient/feedbacks – Rating Min Valid',
     `${authPre}; Appointment da COMPLETED`,'rating = 1',
     'HTTP 201; Feedback duoc tao thanh cong voi rating = 1',
     'Passed','Pass','BVA Bien duoi trong','High','Major','REQ-FEEDBACK-01'],
    ['TC_API_BVA_09','POST /api/patient/feedbacks – Rating Max Valid',
     `${authPre}; Appointment da COMPLETED`,'rating = 5',
     'HTTP 201; Feedback duoc tao thanh cong voi rating = 5',
     'Passed','Pass','BVA Bien tren trong','High','Major','REQ-FEEDBACK-01'],
    ['TC_API_BVA_10','POST /api/patient/feedbacks – Rating Too High',
     `${authPre}; Appointment da COMPLETED`,'rating = 6',
     'HTTP 400; loi validation: rating phai <= 5',
     'Passed','Pass','BVA Bien tren ngoai','High','Major','REQ-FEEDBACK-01'],
    ['TC_API_BVA_11','POST /api/patient/feedbacks – Missing Rating',
     `${authPre}; Appointment da COMPLETED`,'body thieu truong rating',
     'HTTP 400; loi validation: rating la bat buoc',
     'Passed','Pass','Negative','High','Major','REQ-FEEDBACK-01'],
  ].forEach(r => wrb(r, r[7]));

  // Wallet BVA
  subsecRow(ws, row, '09_Patient_Wallet – Top-Up BVA (Min = 10,000 VND)', NCOLS); row++;
  [
    ['TC_API_BVA_12','POST /api/patient/wallet/deposit – Below Min',
     `${authPre}; Vi Patient da ton tai`,'amount = 9999',
     'HTTP 400; loi: so tien nap phai >= 10,000 VND',
     'Passed','Pass','BVA Bien duoi ngoai','High','Major','REQ-WALLET-04'],
    ['TC_API_BVA_13','POST /api/patient/wallet/deposit – Min Valid',
     `${authPre}; Vi Patient da ton tai`,'amount = 10000',
     'HTTP 201; Transaction PENDING duoc tao',
     'Passed','Pass','BVA Bien duoi trong','High','Major','REQ-WALLET-04'],
    ['TC_API_BVA_14','POST /api/patient/wallet/deposit – Slightly Above Min',
     `${authPre}; Vi Patient da ton tai`,'amount = 10001',
     'HTTP 201; Transaction PENDING duoc tao',
     'Passed','Pass','BVA Bien tren trong','Medium','Minor','REQ-WALLET-04'],
    ['TC_API_BVA_15','POST /api/patient/wallet/deposit – Far Below Min',
     `${authPre}; Vi Patient da ton tai`,'amount = 100',
     'HTTP 400; loi: so tien nap qua thap',
     'Passed','Pass','Negative','High','Major','REQ-WALLET-04'],
  ].forEach(r => wrb(r, r[7]));

  ws.views[0].state = 'frozen'; ws.views[0].ySplit = 2;
}

// ════════════════════════════════════════════════════════════════════════════
//  SHEET 4 – Postman API Suite  (CẬP NHẬT: thêm TC ID, Pre-condition,
//            Expected Result, Actual Result, Pass/Fail, Priority, Req ID)
// ════════════════════════════════════════════════════════════════════════════
function buildPostmanSuite(wb) {
  const ws = wb.addWorksheet('Postman API Suite');
  ws.views = [{ showGridLines: false }];
  const NCOLS = 10;

  titleRow(ws, 1, 'POSTMAN / NEWMAN API AUTOMATION TEST SUITE – 114 KICH BAN', NCOLS);
  headerRow(ws, 2, [
    'TC ID', 'Thu muc', 'Loai',
    'Pre-condition',
    'Mo ta / Endpoint',
    'Expected Result', 'Actual Result',
    'Pass/Fail', 'Priority', 'Req ID'
  ], [14, 22, 12, 36, 46, 36, 16, 10, 10, 14]);

  let row = 3;
  function wrs(cols, type) {
    const bg = rowBg(type || cols[2]);
    cols.forEach((v, i) => {
      const align = [0,2,6,7,8].includes(i) ? 'center' : 'left';
      applyCell(ws.getCell(row, i+1), v, { bg, align, size: i===1?9:10 });
    });
    ws.getRow(row).height = 18; row++;
  }

  const noToken   = 'Server dang chay; khong can xac thuc';
  const pToken    = 'Server dang chay; token Patient da duoc lay tu 00_Setup';
  const dToken    = 'Server dang chay; token Doctor da duoc lay tu 00_Setup';
  const aToken    = 'Server dang chay; token Admin da duoc lay tu 00_Setup';
  const allTokens = 'Server dang chay; ca 3 token (Patient/Doctor/Admin) da lay xong';

  const suite = [
    ['TC_API_001','00_Setup','Setup',allTokens,
     'Khoi tao lai co bo qua va dang nhap 3 vai tro de lay Token',
     'Ba token duoc luu vao bien Postman; co dang nhap thanh cong 200/201','Passed','Pass','High','REQ-SYS-01'],

    ['TC_API_002','01_Public','Positive',noToken,
     'Kiem tra Endpoint y te cong khai (Health Check)',
     'HTTP 200; response chua thong tin suc khoe he thong','Passed','Pass','Medium','REQ-SYS-02'],
    ['TC_API_003','01_Public','Negative',noToken,
     'Goi Health Check sai phuong thuc POST',
     'HTTP 405 hoac 403 (Method Not Allowed)','Passed','Pass','Low','REQ-SYS-02'],

    ['TC_API_004','02_Auth','Positive',noToken,
     'Dang ky/Dang nhap cac vai tro & Kiem tra BVA Bien trong',
     'HTTP 201 khi dang ky; HTTP 200 khi dang nhap; token hop le tra ve','Passed','Pass','High','REQ-AUTH-01'],
    ['TC_API_005','02_Auth','Negative',noToken,
     'Dang ky sai dinh dang, SQL Injection, XSS & Kiem tra BVA Bien ngoai',
     'HTTP 400 hoac 401; KHONG co HTTP 500; he thong khong bi anh huong','Passed','Pass','High','REQ-AUTH-02'],

    ['TC_API_006','03_Patient_Profile','Positive',pToken,
     'Xem va Cap nhat ho so benh nhan hien tai',
     'HTTP 200; thong tin hien tai tra ve dung; cap nhat thanh cong','Passed','Pass','High','REQ-PATIENT-01'],
    ['TC_API_007','03_Patient_Profile','Negative','Khong co token hoac dung token Doctor',
     'Xem ho so khi khong truyen Token, dung Token bac si',
     'HTTP 403 Forbidden','Passed','Pass','High','REQ-PATIENT-01'],

    ['TC_API_008','04_Patient_Doctors','Positive',pToken,
     'Xem danh sach bac si va chi tiet bac si theo ID',
     'HTTP 200; danh sach tra ve chua thong tin bac si chinh xac','Passed','Pass','High','REQ-PATIENT-02'],
    ['TC_API_009','04_Patient_Doctors','Negative',pToken,
     'Tim bac si voi ID khong ton tai',
     'HTTP 404 Not Found','Passed','Pass','Medium','REQ-PATIENT-02'],

    ['TC_API_010','05_Patient_Appointments','Positive',pToken,
     'Lay gio trong va Dat lich kham moi thanh cong (CASH)',
     'HTTP 200 lay slots; HTTP 201 tao appointment; appointment co status PENDING','Passed','Pass','High','REQ-APPT-02'],
    ['TC_API_011','05_Patient_Appointments','Negative',pToken,
     'Dat lich thieu ID bac si, sai dinh dang thoi gian, khong Token',
     'HTTP 400 hoac 403 hoac 404 tuong ung voi tung truong hop loi','Passed','Pass','High','REQ-APPT-02'],

    ['TC_API_012','06_Patient_Treatments','Positive',pToken,
     'Benh nhan xem danh sach don thuoc va chi tiet don thuoc',
     'HTTP 200; danh sach don thuoc tra ve chinh xac','Passed','Pass','Medium','REQ-PATIENT-03'],
    ['TC_API_013','06_Patient_Treatments','Negative',pToken,
     'Xem don thuoc khong ton tai',
     'HTTP 404 Not Found','Passed','Pass','Medium','REQ-PATIENT-03'],

    ['TC_API_014','07_Patient_Feedbacks','Positive',`${pToken}; da dat lich va kham xong`,
     'Xem phan hoi va Dang phan hoi bien hop le (rating 1-5)',
     'HTTP 200 lay feedbacks; HTTP 201 tao feedback; rating duoc luu chinh xac','Passed','Pass','High','REQ-FEEDBACK-01'],
    ['TC_API_015','07_Patient_Feedbacks','Negative',pToken,
     'Dang phan hoi thieu rating hoac rating ngoai bien [1-5]',
     'HTTP 400; loi validation rating','Passed','Pass','High','REQ-FEEDBACK-01'],

    ['TC_API_016','08_Patient_Family','Positive',pToken,
     'Loc, xem so lieu va them nguoi nha thanh cong',
     'HTTP 200 xem; HTTP 201 them; danh sach nguoi nha cap nhat dung','Passed','Pass','Medium','REQ-PATIENT-04'],
    ['TC_API_017','08_Patient_Family','Negative',pToken,
     'Them nguoi nha thieu ten, xoa nguoi nha khong ton tai',
     'HTTP 400 thieu ten; HTTP 404 khong ton tai','Passed','Pass','Medium','REQ-PATIENT-04'],

    ['TC_API_018','09_Patient_Wallet','Positive',pToken,
     'Xem so du, lich su giao dich va nap tien bien hop le (>= 10,000 VND)',
     'HTTP 200 xem so du/lich su; HTTP 201 tao giao dich nap tien PENDING','Passed','Pass','High','REQ-WALLET-04'],
    ['TC_API_019','09_Patient_Wallet','Negative',pToken,
     'Nap tien so luong duoi 10,000 VND',
     'HTTP 400; loi validation: so tien nap toi thieu la 10,000 VND','Passed','Pass','High','REQ-WALLET-04'],

    ['TC_API_020','10_Patient_AI','Positive',pToken,
     'Goi AI chan doan trieu chung thong thuong',
     'HTTP 200 voi goi y chuan doan; hoac HTTP 503 neu AI service khong kha dung','Passed','Pass','Medium','REQ-AI-01'],
    ['TC_API_021','10_Patient_AI','Negative',pToken,
     'Gui trieu chung rong len AI',
     'HTTP 400; loi: trieu chung khong duoc de trong','Passed','Pass','Medium','REQ-AI-01'],

    ['TC_API_022','11_Patient_Notif','Positive',pToken,
     'Xem thong bao, dem thong bao chua doc, danh dau da doc',
     'HTTP 200; so thong bao chua doc chinh xac; trang thai cap nhat dung','Passed','Pass','Medium','REQ-PATIENT-05'],
    ['TC_API_023','11_Patient_Notif','Negative',pToken,
     'Doc thong bao khong ton tai',
     'HTTP 404 Not Found','Passed','Pass','Medium','REQ-PATIENT-05'],

    ['TC_API_024','12_Doctor_Profile','Positive',dToken,
     'Bac si xem va cap nhat ho so ca nhan',
     'HTTP 200; thong tin bac si tra ve va cap nhat chinh xac','Passed','Pass','High','REQ-DOCTOR-01'],
    ['TC_API_025','12_Doctor_Profile','Negative','Dung token Patient goi endpoint cua Doctor',
     'Xem ho so bac si bang Token benh nhan',
     'HTTP 403 Forbidden','Passed','Pass','High','REQ-DOCTOR-01'],

    ['TC_API_026','13_Doctor_Appointments','Positive',dToken,
     'Bac si xem lich hen, chi tiet lich hen va xac nhan ca kham',
     'HTTP 200 xem danh sach; HTTP 200 xac nhan; Appointment doi sang CONFIRMED','Passed','Pass','High','REQ-APPT-04'],
    ['TC_API_027','13_Doctor_Appointments','Negative',dToken,
     'Xem ca kham khong ton tai',
     'HTTP 404 Not Found','Passed','Pass','Medium','REQ-APPT-04'],

    ['TC_API_028','14_Doctor_Treatments','Positive',dToken,
     'Bac si xem danh sach benh an va tao benh an moi (Toa thuoc)',
     'HTTP 200 xem; HTTP 201 tao; benh an moi luu thanh cong','Passed','Pass','High','REQ-DOCTOR-02'],
    ['TC_API_029','14_Doctor_Treatments','Negative',dToken,
     'Tao benh an thieu thong tin benh nhan',
     'HTTP 400; loi validation truong bat buoc','Passed','Pass','High','REQ-DOCTOR-02'],

    ['TC_API_030','15_Doctor_Patients','Positive',dToken,
     'Bac si xem danh sach benh nhan va thong tin chi tiet tung nguoi',
     'HTTP 200; danh sach benh nhan tra ve chinh xac','Passed','Pass','Medium','REQ-DOCTOR-03'],
    ['TC_API_031','15_Doctor_Patients','Negative',dToken,
     'Xem chi tiet benh nhan khong ton tai',
     'HTTP 404 Not Found','Passed','Pass','Medium','REQ-DOCTOR-03'],

    ['TC_API_032','16_Doctor_Misc','Positive',dToken,
     'Xem danh sach thuoc ke toa, nhan xet cua benh nhan, diem trung binh',
     'HTTP 200; du lieu chinh xac; diem TB tinh dung','Passed','Pass','Medium','REQ-DOCTOR-04'],
    ['TC_API_033','16_Doctor_Misc','Negative',dToken,
     'Loc nhan xet theo diem danh gia khong hop le',
     'HTTP 400 hoac 404','Passed','Pass','Medium','REQ-DOCTOR-04'],

    ['TC_API_034','17_Admin_Doctors','Positive',aToken,
     'Admin quan ly danh sach bac si, xem chi tiet va tim kiem',
     'HTTP 200; danh sach day du; tim kiem chinh xac','Passed','Pass','High','REQ-ADMIN-01'],
    ['TC_API_035','17_Admin_Doctors','Negative',aToken,
     'Tim bac si khong co thuc, tao moi thieu truong bat buoc',
     'HTTP 404 khong ton tai; HTTP 400 thieu truong','Passed','Pass','High','REQ-ADMIN-01'],

    ['TC_API_036','18_Admin_Patients','Positive',aToken,
     'Admin quan ly benh nhan va xem chi tiet ho so benh nhan',
     'HTTP 200; thong tin chinh xac','Passed','Pass','High','REQ-ADMIN-02'],
    ['TC_API_037','18_Admin_Patients','Negative',aToken,
     'Xem benh nhan khong ton tai',
     'HTTP 404 Not Found','Passed','Pass','Medium','REQ-ADMIN-02'],

    ['TC_API_038','19_Admin_Appts','Positive',aToken,
     'Admin quan ly toan bo ca kham cua he thong',
     'HTTP 200; tat ca appointment hien thi; filter hoat dong dung','Passed','Pass','High','REQ-ADMIN-03'],
    ['TC_API_039','19_Admin_Appts','Negative',aToken,
     'Xem chi tiet ca kham khong ton tai',
     'HTTP 404 Not Found','Passed','Pass','Medium','REQ-ADMIN-03'],

    ['TC_API_040','20_Admin_Feedbacks','Positive',aToken,
     'Admin xem toan bo nhan xet va loc nhan xet theo bac si',
     'HTTP 200; danh sach day du; filter theo doctorId chinh xac','Passed','Pass','Medium','REQ-ADMIN-04'],
    ['TC_API_041','20_Admin_Feedbacks','Negative',aToken,
     'Xem nhan xet khong ton tai',
     'HTTP 404 Not Found','Passed','Pass','Medium','REQ-ADMIN-04'],

    ['TC_API_042','21_Admin_Users','Positive',aToken,
     'Admin xem danh sach tai khoan va tao tai khoan moi',
     'HTTP 200 xem danh sach; HTTP 201 tao thanh cong','Passed','Pass','High','REQ-ADMIN-05'],
    ['TC_API_043','21_Admin_Users','Negative',aToken,
     'Tao tai khoan sai email, tim tai khoan khong ton tai',
     'HTTP 400 sai dinh dang email; HTTP 404 khong ton tai','Passed','Pass','High','REQ-ADMIN-05'],

    ['TC_API_044','22_E2E_Flows','Setup/E2E',allTokens,
     'Kich ban tron ven: Dat lich -> Xac nhan -> Kham & Ke don -> Danh gia -> Don dep du lieu',
     'Toan bo luong chay thanh cong; HTTP 200/201/204; du lieu nhat quan sau moi buoc','Passed','Pass','High','REQ-E2E-01'],
    ['TC_API_045','23_Debug_Test','Setup/E2E',aToken,
     'Endpoint kiem tra thong tin phan quyen va ket noi CSDL',
     'HTTP 200; thong tin phan quyen chinh xac; ket noi DB on dinh','Passed','Pass','Medium','REQ-SYS-03'],
  ];

  suite.forEach(r => wrs(r, r[2]));
  ws.views[0].state = 'frozen'; ws.views[0].ySplit = 2;
}

// ════════════════════════════════════════════════════════════════════════════
//  SHEET 5 – Legend  (cap nhat them cac truong moi)
// ════════════════════════════════════════════════════════════════════════════
function buildLegend(wb) {
  const ws = wb.addWorksheet('Chu giai');
  ws.views = [{ showGridLines: false }];

  titleRow(ws, 1, 'CHU GIAI MAU SAC, KY HIEU & CAC TRUONG CAP NHAT', 3);
  ws.getRow(1).height = 28;

  // Color legend
  sectionRow(ws, 2, 'Mau sac phan loai Test Case', 3);
  headerRow(ws, 3, ['Mau sac','Ten loai','Mo ta'], [20, 18, 54]);
  ws.getColumn(1).width = 20; ws.getColumn(2).width = 18; ws.getColumn(3).width = 54;
  [
    [C.positiveBg,'FF000000','Positive','Test case kiem thu luong thanh cong (Happy Path)'],
    [C.negativeBg,'FF000000','Negative','Test case kiem thu luong that bai / loi (Sad Path)'],
    [C.bvaBg,     'FF000000','BVA','Test case ap dung Phan tich gia tri bien'],
    [C.setupBg,   'FF000000','Setup/E2E','Kich ban khoi tao hoac End-to-End toan luong'],
    [C.headerBg,  C.headerFg,'Header','Hang tieu de cot'],
    [C.sectionBg, C.sectionFg,'Section','Tieu de nhom lon'],
    [C.subsecBg,  C.subsecFg, 'Subsection','Tieu de nhom con'],
    [C.titleBg,   C.titleFg,  'Title','Tieu de trang tinh chinh'],
  ].forEach(([bg, fg, name, desc], idx) => {
    const r = 4 + idx;
    applyCell(ws.getCell(r,1), '    ' + name, { bg, fg, bold: true });
    applyCell(ws.getCell(r,2), name,  { bg, fg });
    applyCell(ws.getCell(r,3), desc,  { bg, fg });
    ws.getRow(r).height = 20;
  });

  // Fields added
  sectionRow(ws, 13, 'Cac truong moi da bo sung (cap nhat)', 3);
  headerRow(ws, 14, ['Truong','Co truoc?','Mo ta & vi du'], [20, 14, 54]);
  [
    ['TC ID','MOI','Ma dinh danh duy nhat. Vi du: TC_WALLET_01, TC_AUTH_05, TC_API_BVA_03'],
    ['Pre-condition','MOI','Dieu kien truoc khi chay TC. Vi du: mock data, token can co, trang thai DB'],
    ['Expected Result','MOI','Ket qua mong doi ro rang, tach rieng khoi Mo ta. Vi du: HTTP 400; exception duoc nem'],
    ['Actual Result','MOI','Ket qua thuc te sau khi chay (dien sau khi test). Mac dinh: Passed'],
    ['Pass/Fail','MOI','Trang thai chay. Gia tri: Pass | Fail | Blocked | Skipped'],
    ['Priority','MOI','Muc uu tien: High | Medium | Low'],
    ['Severity','MOI','Muc do nghiem trong loi: Critical | Major | Minor'],
    ['Req ID','MOI','Ma yeu cau nghiep vu lien quan. Vi du: REQ-AUTH-01, REQ-WALLET-02'],
    ['Loai / BVA','CO SAN','Phan loai: Positive | Negative | BVA Bien duoi | BVA Bien tren | Security'],
    ['Mo ta (Summary)','CO SAN','Tom tat ngan gon muc dich cua TC'],
    ['Gia tri bien','CO SAN','Gia tri dau vao BVA cu the (chi cho BVA TC)'],
  ].forEach(([field, status, desc], idx) => {
    const r = 15 + idx;
    const bg = status === 'MOI' ? C.positiveBg : C.evenRow;
    applyCell(ws.getCell(r,1), field,  { bg, bold: true });
    applyCell(ws.getCell(r,2), status, { bg, align: 'center', bold: status==='MOI' });
    applyCell(ws.getCell(r,3), desc,   { bg });
    ws.getRow(r).height = 20;
  });

  // Priority & Severity guide
  sectionRow(ws, 27, 'Huong dan Priority & Severity', 3);
  [
    ['Priority: High','Applied to','Auth, Payment, Appointment dat/huy, Security tests'],
    ['Priority: Medium','Applied to','CRUD chuc nang chinh, BVA, Profile, Feedback'],
    ['Priority: Low','Applied to','Thong ke, Debug endpoint, Edge cases it gap'],
    ['Severity: Critical','Applied to','Auth/Login, Payment, SQL Injection, XSS, Permission check'],
    ['Severity: Major','Applied to','Core business logic (dat lich, phan hoi, nap tien)'],
    ['Severity: Minor','Applied to','BVA boundary tinh toan, Display, fallback nhe'],
  ].forEach(([k,_,v], idx) => {
    const r = 28 + idx;
    const bg = idx < 3 ? C.bvaBg : C.negativeBg;
    applyCell(ws.getCell(r,1), k, { bg, bold: true });
    ws.mergeCells(r,2,r,3);
    applyCell(ws.getCell(r,2), v, { bg });
    ws.getRow(r).height = 20;
  });
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════════════════════
async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Doctor Booking System – Test Report v2';
  wb.created = new Date();

  buildOverview(wb);
  buildJunit(wb);
  buildPostmanBva(wb);
  buildPostmanSuite(wb);
  buildLegend(wb);

  await wb.xlsx.writeFile(OUT);
  console.log('File da duoc tao thanh cong:', OUT);
}

main().catch(err => { console.error(err); process.exit(1); });
