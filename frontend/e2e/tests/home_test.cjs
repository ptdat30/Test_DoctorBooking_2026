// e2e/tests/home_test.js
// Test: Public Homepage – Không cần đăng nhập

'use strict';

const factory = require('../data/factory.cjs');

Feature('Public Homepage');

/**
 * TC-HOME-01: Trang chủ load thành công
 */
Scenario('Trang chủ hiển thị đúng khi truy cập', async ({ I, HomePage }) => {
  // Arrange – không cần setup data
  // Act
  await HomePage.navigateTo();
  // Assert
  HomePage.seePageLoaded();
}).tag('@smoke').tag('@homepage');

/**
 * TC-HOME-02: Click Login → redirect đến /login
 */
Scenario('Click Login link → điều hướng đến trang đăng nhập', async ({ I, HomePage }) => {
  // Arrange
  await HomePage.navigateTo();
  // Act
  HomePage.clickLogin();
  // Assert – waitForNavigation đã được xử lý bên trong action
  I.seeInCurrentUrl('/login');
}).tag('@smoke').tag('@homepage').tag('@navigation');

/**
 * TC-HOME-03: Click Register → redirect đến /register
 */
Scenario('Click Register link → điều hướng đến trang đăng ký', async ({ I, HomePage }) => {
  await HomePage.navigateTo();
  HomePage.clickRegister();
  I.seeInCurrentUrl('/register');
}).tag('@homepage').tag('@navigation');

/**
 * TC-HOME-04: Truy cập URL không tồn tại → 404 page
 */
Scenario('URL không tồn tại → hiển thị trang 404 @homepage', async ({ I }) => {
  I.amOnPage('/this-page-does-not-exist-xyz');
  // React SPA không trigger navigation event thật → dùng waitForElement thay vì waitForNavigation
  // NotFound.jsx render ngay lập tức, chờ content xuất hiện
  I.waitForElement('body', 5);
  I.seeInCurrentUrl('/this-page-does-not-exist-xyz');
  // Kiểm tra NotFound component đã render (thấy text 404 hoặc "Not Found")
  I.waitForText('404', 5);
}).tag('@homepage');
