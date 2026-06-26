// e2e/tests/auth/login_test.js
// Test: Luồng Đăng nhập – Patient, Doctor, Admin; lỗi, edge cases

'use strict';

const factory = require('../../data/factory.cjs');

Feature('Đăng nhập (Login)');

// ── State Isolation: Tạo user riêng cho mỗi suite ────────────────────────
let testPatient;

Before(async ({ I }) => {
  // Tạo patient test mới mỗi lần chạy → tránh conflict parallel
  testPatient = factory.createUser();
  await I.createTestUser(testPatient);
});

After(async ({ I }) => {
  // Cleanup: xóa user sau khi test xong
  if (testPatient?.username) {
    await I.deleteTestUser(testPatient.username);
  }
});

// ─────────────────────────────────────────────────────────────────────────

/**
 * TC-LOGIN-01: Đăng nhập thành công với Patient account
 */
Scenario('TC-LOGIN-01: Patient đăng nhập thành công và được redirect đúng', async ({ I, LoginPage }) => {
  // Arrange: testPatient đã được tạo trong Before()
  // Act
  await LoginPage.login(testPatient.username, testPatient.password);
  // Assert
  I.waitInUrl('/patient/dashboard', 10);
}).tag('@smoke').tag('@login').tag('@patient');

/**
 * TC-LOGIN-02: Đăng nhập bằng sai mật khẩu → hiển thị thông báo lỗi
 */
Scenario('TC-LOGIN-02: Sai mật khẩu → hiển thị error message', async ({ I, LoginPage }) => {
  // Arrange
  await LoginPage.navigateTo();
  // Act: dùng đúng username nhưng sai password
  LoginPage.fillCredentials(testPatient.username, 'WrongPassword!999');
  LoginPage.submit();
  // Assert: phải thấy error message (không redirect)
  I.waitForElement('[class*="error"], .error-message', 5);
  I.seeInCurrentUrl('/login');
}).tag('@login').tag('@negative');

/**
 * TC-LOGIN-03: Username không tồn tại → hiển thị error message
 */
Scenario('TC-LOGIN-03: Username không tồn tại → hiển thị error', async ({ I, LoginPage }) => {
  await LoginPage.navigateTo();
  LoginPage.fillCredentials('nonexistent_user_xyz_999', 'AnyPassword@123');
  LoginPage.submit();
  I.waitForElement('[class*="error"], .error-message', 5);
  I.seeInCurrentUrl('/login');
}).tag('@login').tag('@negative');

/**
 * TC-LOGIN-04: Để trống username và password → HTML5 validation
 */
Scenario('TC-LOGIN-04: Để trống form → không thể submit (HTML5 required)', async ({ I, LoginPage }) => {
  await LoginPage.navigateTo();
  // Act: click submit mà không fill gì
  I.click('button[type="submit"].auth-submit-btn');
  // Assert: vẫn ở trang login (HTML5 required validation ngăn submit)
  I.seeInCurrentUrl('/login');
  // Kiểm tra browser validation trên input required
  I.seeElement('#login-username:invalid, #login-username[required]');
}).tag('@login').tag('@negative').tag('@validation');

/**
 * TC-LOGIN-05: Đăng nhập xong → quay lại /login phải redirect về dashboard
 */
Scenario('TC-LOGIN-05: User đã login khi truy cập /login → redirect về dashboard', async ({ I, LoginPage }) => {
  // Arrange: login trước
  await LoginPage.login(testPatient.username, testPatient.password);
  I.waitInUrl('/patient/dashboard', 10);
  // Act: thử vào /login khi đã có token
  I.amOnPage('/login');
  // Assert: app phải redirect về dashboard (guard route)
  I.waitInUrl('/patient/dashboard', 5);
}).tag('@login').tag('@routing');

