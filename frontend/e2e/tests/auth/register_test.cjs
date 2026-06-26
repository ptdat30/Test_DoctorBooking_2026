// e2e/tests/auth/register_test.js
// Test: Luồng Đăng ký tài khoản – Happy path + Negative cases

'use strict';

const factory = require('../../data/factory.cjs');

Feature('Đăng ký tài khoản (Register)');

// Lưu username để cleanup sau test
let createdUsername = null;

After(async ({ I }) => {
  if (createdUsername) {
    await I.deleteTestUser(createdUsername);
    createdUsername = null;
  }
});

// ─────────────────────────────────────────────────────────────────────────

/**
 * TC-REG-01: Đăng ký thành công với dữ liệu hợp lệ từ factory
 */
Scenario('TC-REG-01: Đăng ký tài khoản mới hợp lệ → redirect về dashboard', async ({ I, RegisterPage }) => {
  // Arrange: sinh data ngẫu nhiên
  const userData = factory.createUser();
  createdUsername = userData.username;  // Lưu để cleanup

  // Act
  await RegisterPage.register(userData);

  // Assert
  I.waitInUrl('/patient/dashboard', 15);
}).tag('@smoke').tag('@register');

/**
 * TC-REG-02: Đăng ký với username đã tồn tại → hiển thị lỗi conflict
 */
Scenario('TC-REG-02: Username trùng → hiển thị error message', async ({ I, RegisterPage }) => {
  // Arrange: tạo user trước
  const existingUser = factory.createUser();
  await I.createTestUser(existingUser);
  createdUsername = existingUser.username;

  // Tạo user mới với cùng username nhưng khác email
  const duplicateUser = {
    ...factory.createUser(),
    username: existingUser.username,  // cố tình trùng username
  };

  // Act
  await RegisterPage.register(duplicateUser);

  // Assert: phải thấy error, không redirect
  I.waitForElement('[class*="error"], .error-message', 8);
  I.seeInCurrentUrl('/register');
}).tag('@register').tag('@negative');

/**
 * TC-REG-03: Đăng ký với email đã tồn tại → hiển thị lỗi
 */
Scenario('TC-REG-03: Email trùng → hiển thị error message', async ({ I, RegisterPage }) => {
  const existingUser = factory.createUser();
  await I.createTestUser(existingUser);
  createdUsername = existingUser.username;

  const duplicateEmailUser = {
    ...factory.createUser(),
    email: existingUser.email,  // cố tình trùng email
  };

  await RegisterPage.register(duplicateEmailUser);
  I.waitForElement('[class*="error"], .error-message', 8);
  I.seeInCurrentUrl('/register');
}).tag('@register').tag('@negative');

/**
 * TC-REG-04: Password quá ngắn (< 6 ký tự) → HTML5 minLength validation
 */
Scenario('TC-REG-04: Password dưới 6 ký tự → không thể submit', async ({ I, RegisterPage }) => {
  const userData = factory.createUser();
  userData.password = '123';  // Quá ngắn

  await RegisterPage.navigateTo();
  RegisterPage.fillForm(userData);
  RegisterPage.submit();

  // Assert: HTML5 minLength ngăn submit → vẫn ở /register
  I.seeInCurrentUrl('/register');
}).tag('@register').tag('@negative').tag('@validation');

/**
 * TC-REG-05: Để trống Full Name (required field) → không thể submit
 */
Scenario('TC-REG-05: Bỏ trống Full Name (required) → không submit được', async ({ I, RegisterPage }) => {
  const userData = factory.createUser();
  userData.fullName = '';  // Bỏ trống field required

  await RegisterPage.navigateTo();
  // Điền tất cả trừ fullName
  I.fillField('#register-username', userData.username);
  I.fillField('#register-email', userData.email);
  I.fillField('#register-password', userData.password);
  I.fillField('#register-confirmPassword', userData.password);
  I.click('.auth-submit-btn');

  // Assert: HTML5 required ngăn submit
  I.seeInCurrentUrl('/register');
}).tag('@register').tag('@negative').tag('@validation');

