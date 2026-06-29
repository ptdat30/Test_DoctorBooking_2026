// e2e/tests/admin/admin_smoke_test.cjs
// Smoke test: Các màn hình admin tương tác được

'use strict';

Feature('Admin — Smoke test các màn hình');

Before(async ({ LoginPage }) => {
  await LoginPage.login('admin', 'admin123');
  LoginPage.seeSuccessRedirect('admin');
});

Scenario('TC-ADM-01: Dashboard admin load thành công', async ({ AdminPage }) => {
  AdminPage.navigateToDashboard();
}).tag('@admin').tag('@smoke');

Scenario('TC-ADM-02: Danh sách người dùng và form tạo mới', async ({ AdminPage }) => {
  AdminPage.navigateToUserList();
  AdminPage.openCreateUserForm();
}).tag('@admin').tag('@smoke');

Scenario('TC-ADM-03: Danh sách bác sĩ và form tạo mới', async ({ AdminPage }) => {
  AdminPage.navigateToDoctorList();
  AdminPage.openCreateDoctorForm();
}).tag('@admin').tag('@smoke');

Scenario('TC-ADM-04: Danh sách bệnh nhân và form tạo mới', async ({ AdminPage }) => {
  AdminPage.navigateToPatientList();
  AdminPage.openCreatePatientForm();
}).tag('@admin').tag('@smoke');

Scenario('TC-ADM-05: Quản lý lịch hẹn load thành công', async ({ AdminPage }) => {
  AdminPage.navigateToAppointmentList();
}).tag('@admin').tag('@smoke');

Scenario('TC-ADM-06: Quản lý phản hồi load thành công', async ({ I, FeedbackPage }) => {
  FeedbackPage.navigateToAdminFeedbacks();
  I.dontSee('404');
}).tag('@admin').tag('@smoke');
