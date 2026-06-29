// e2e/tests/patient/appointment_payment_test.cjs
// Test: Trang kết quả thanh toán lịch hẹn VNPAY

'use strict';

const factory = require('../../data/factory.cjs');

Feature('Kết quả thanh toán lịch hẹn (Appointment Payment)');

let testPatient;

Before(async ({ I, LoginPage }) => {
  testPatient = factory.createUser();
  await I.createTestUser(testPatient);
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');
});

After(async ({ I }) => {
  if (testPatient?.username) {
    await I.deleteTestUser(testPatient.username);
  }
});

Scenario('TC-APT-PAY-01: Callback thành công → hiển thị thông báo thanh toán OK', async ({ AppointmentPaymentPage }) => {
  AppointmentPaymentPage.navigateToResult({ success: true, appointmentId: 501, amount: 300000 });
  AppointmentPaymentPage.seePaymentSuccess();
  AppointmentPaymentPage.seeAppointmentId(501);
}).tag('@patient').tag('@payment').tag('@smoke');

Scenario('TC-APT-PAY-02: Callback thất bại (hủy giao dịch) → hiển thị lỗi', async ({ AppointmentPaymentPage }) => {
  AppointmentPaymentPage.navigateToResult({ success: false, appointmentId: 502, amount: 300000 });
  AppointmentPaymentPage.seePaymentFailure();
}).tag('@patient').tag('@payment').tag('@smoke');
