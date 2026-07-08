// e2e/tests/doctor/doctor_smoke_test.cjs
// Smoke test: Các màn hình bác sĩ tương tác được

'use strict';

Feature('Bác sĩ — Smoke test các màn hình');

Before(async ({ LoginPage }) => {
  await LoginPage.login('doctor1', 'password123');
  LoginPage.seeSuccessRedirect('doctor');
});

Scenario('TC-DOC-01: Dashboard bác sĩ load thành công', async ({ DoctorDashboardPage }) => {
  DoctorDashboardPage.navigateTo();
  DoctorDashboardPage.seeDashboardLoaded();
}).tag('@doctor').tag('@smoke');

Scenario('TC-DOC-02: Trang hồ sơ bác sĩ load và mở form chỉnh sửa', async ({ DoctorProfilePage }) => {
  DoctorProfilePage.navigateTo();
  DoctorProfilePage.seeProfileLoaded();
  DoctorProfilePage.openEditProfile();
}).tag('@doctor').tag('@smoke');

Scenario('TC-DOC-03: Tìm kiếm bệnh nhân theo từ khóa', async ({ DoctorPatientSearchPage }) => {
  DoctorPatientSearchPage.navigateTo();
  DoctorPatientSearchPage.seePageLoaded();
  DoctorPatientSearchPage.search('a');
  DoctorPatientSearchPage.seePageLoaded();
}).tag('@doctor').tag('@smoke');

Scenario('TC-DOC-04: Trang lịch hẹn bác sĩ load thành công', async ({ I, DoctorPage }) => {
  DoctorPage.navigateToAppointments();
  I.dontSee('404');
  I.dontSee('500');
}).tag('@doctor').tag('@smoke');

Scenario('TC-DOC-05: Trang phản hồi bác sĩ load thành công', async ({ I, FeedbackPage }) => {
  FeedbackPage.navigateToDoctorFeedbacks();
  I.dontSee('404');
}).tag('@doctor').tag('@smoke');

Scenario('TC-DOC-06: Trang quản lý điều trị load thành công', async ({ I }) => {
  I.amOnPage('/doctor/treatments');
  I.waitInUrl('/doctor/treatments', 10);
  I.waitForText('Quản lý điều trị', 10);
}).tag('@doctor').tag('@smoke');
