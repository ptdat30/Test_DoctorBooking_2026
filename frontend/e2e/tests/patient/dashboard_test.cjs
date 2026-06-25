// e2e/tests/patient/dashboard_test.js
// Test: Patient Dashboard – Kiểm tra quyền truy cập và hiển thị

'use strict';

const factory = require('../../data/factory.cjs');

Feature('Patient Dashboard');

let testPatient;

Before(async ({ I }) => {
  // Tạo patient riêng cho mỗi test chạy
  testPatient = factory.createUser();
  await I.createTestUser(testPatient);
});

After(async ({ I }) => {
  if (testPatient?.username) {
    await I.deleteTestUser(testPatient.username);
  }
});

// ─────────────────────────────────────────────────────────────────────────

/**
 * TC-DASH-01: Patient login → Dashboard hiển thị đúng
 */
Scenario('TC-DASH-01: Patient thấy dashboard sau khi đăng nhập thành công', async ({ I, LoginPage, PatientDashboardPage }) => {
  // Arrange + Act: Login
  await LoginPage.login(testPatient.username, testPatient.password);

  // Assert
  PatientDashboardPage.waitForLoad();
  PatientDashboardPage.seeDashboardLoaded();
}).tag('@smoke').tag('@dashboard').tag('@patient');

/**
 * TC-DASH-02: Chưa đăng nhập → truy cập dashboard bị redirect về /login
 */
Scenario('TC-DASH-02: Chưa login → truy cập /patient/dashboard → redirect về /login', async ({ I, AuthSteps }) => {
  // Act: truy cập protected route khi không có token
  AuthSteps.assertRedirectToLoginWhenUnauth('/patient/dashboard');
  // Assert: đã ở /login
  I.seeInCurrentUrl('/login');
}).tag('@dashboard').tag('@auth').tag('@routing');

/**
 * TC-DASH-03: Dashboard hiển thị stats section
 */
Scenario('TC-DASH-03: Dashboard có hiển thị phần thống kê', async ({ I, LoginPage, PatientDashboardPage }) => {
  await LoginPage.login(testPatient.username, testPatient.password);
  PatientDashboardPage.waitForLoad();

  // Assert: stats card phải có trên màn hình
  PatientDashboardPage.seeStatsSection();
}).tag('@dashboard').tag('@patient');

/**
 * TC-DASH-04: Logout → redirect về /login
 */
Scenario('TC-DASH-04: Logout từ dashboard → về trang đăng nhập', async ({ I, LoginPage, PatientDashboardPage, AuthSteps }) => {
  // Arrange: login
  await LoginPage.login(testPatient.username, testPatient.password);
  PatientDashboardPage.waitForLoad();

  // Act: logout qua AuthSteps (clear localStorage)
  AuthSteps.logout();

  // Assert
  I.seeInCurrentUrl('/login');
}).tag('@dashboard').tag('@auth');

