// e2e/tests/integration/admin_flow_test.cjs
// Test tích hợp Quyền Admin: Khóa tài khoản Bác sĩ (Admin Toggle Doctor Status)

'use strict';

const factory = require('../../data/factory.cjs');
const { resolveDoctor1Id } = require('../../helpers/doctorResolver.cjs');

Feature('Tích hợp Quyền Admin: Khóa tài khoản Bác sĩ (Admin Toggle Doctor Status)');

let testPatient;

Before(async ({ I }) => {
  testPatient = factory.createUser();
  await I.createTestUser(testPatient);
});

After(async ({ I }) => {
  if (testPatient?.username) {
    await I.deleteTestUser(testPatient.username);
  }
});

// ─────────────────────────────────────────────────────────────────────────

Scenario('TC-INT-05: Admin khóa tài khoản Doctor -> Doctor không thể login -> Doctor biến mất khỏi danh sách đặt lịch của Patient', async ({ I, LoginPage, AdminPage, BookingPage }) => {
  await I.acceptBrowserDialogs();

  // Step 1: Admin đăng nhập và khóa tài khoản doctor1
  await LoginPage.login('admin', 'admin123');
  LoginPage.seeSuccessRedirect('admin');

  AdminPage.navigateToUserList();
  await AdminPage.editUserStatus('doctor1', 'inactive');

  // Logout Admin
  I.executeScript(() => {
    localStorage.clear();
    window.location.reload();
  });
  I.waitInUrl('/login', 10);

  // Step 2: Bác sĩ doctor1 cố gắng đăng nhập -> Thất bại
  await LoginPage.login('doctor1', 'password123');
  LoginPage.seeError('Invalid username or password');
  I.dontSeeInCurrentUrl('/doctor/dashboard');

  // Step 3: Bệnh nhân đăng nhập và vào trang Đặt lịch khám
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  await BookingPage.navigateTo();

  // Kiểm tra doctor1 không xuất hiện trong dropdown bác sĩ
  I.waitForElement('select[name="doctorId"]', 10);
  
  const doctorId = await resolveDoctor1Id(I);

  I.dontSeeElement('select[name="doctorId"] option[value="' + doctorId + '"]');

  // Logout Patient
  I.executeScript(() => {
    localStorage.clear();
    window.location.reload();
  });
  I.waitInUrl('/login', 10);

  // Step 4: Admin đăng nhập lại để mở khóa tài khoản doctor1 (để giữ trạng thái DB sạch/nhất quán)
  await LoginPage.login('admin', 'admin123');
  LoginPage.seeSuccessRedirect('admin');

  AdminPage.navigateToUserList();
  await AdminPage.editUserStatus('doctor1', 'active');
}).tag('@integration').tag('@admin').tag('@doctor');
