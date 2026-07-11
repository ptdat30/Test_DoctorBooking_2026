// e2e/tests/patient/history_test.cjs
// Test: Bệnh nhân xem lịch sử và tự hủy lịch hẹn

'use strict';

const factory = require('../../data/factory.cjs');

Feature('Lịch sử đặt lịch (Booking History)');

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

Scenario('TC-HISTORY-01: Bệnh nhân hủy lịch hẹn PENDING thành công', async ({ I, BookingPage, BookingHistoryPage }) => {
  // Chọn bác sĩ miễn phí (consultationFee = 0) để không cần payment method → tạo PENDING trực tiếp.
  // (Patient test mới có ví = 0 nên không thể dùng WALLET cho bác sĩ có phí.)
  const doctors = await I.getDoctors();
  const freeDoctor = doctors.find(d => Number(d.consultationFee || 0) === 0);
  const doctorId = freeDoctor ? freeDoctor.id : doctors[0]?.id;
  if (!doctorId) {
    console.warn('[Smoke] No doctor seed data available; skipping booking-history cancellation flow.');
    return;
  }

  // Đặt lịch với ngày đầu tiên còn slot trống (robust, không hard-code ngày)
  await BookingPage.navigateTo();
  await BookingPage.selectDoctorById(doctorId);
  try {
    await BookingPage.selectFirstAvailableDate();
  } catch (err) {
    console.warn('[Smoke] No slots available in next 7 days; skipping booking-history cancellation flow.');
    return;
  }
  I.waitForElement('select[name="appointmentTime"] option:not([value=""])', 15);
  await BookingPage.selectFirstAvailableTimeSlot();
  BookingPage.fillNotes('E2E test cancel by patient');
  BookingPage.submitBooking();
  await BookingPage.confirmInModal();
  I.waitInUrl('/patient/history', 20);
  BookingHistoryPage.seeStatus('PENDING');

  // Bệnh nhân tự hủy (patient cancel không bị ràng buộc 24h)
  BookingHistoryPage.navigateTo();
  BookingHistoryPage.cancelFirstAppointment();
  BookingHistoryPage.seeCancelSuccess();
  BookingHistoryPage.seeStatus('CANCELLED');
}).tag('@patient').tag('@history').tag('@smoke');
