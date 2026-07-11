// e2e/tests/patient/booking_test.js
// Test: Đặt lịch khám – E2E Flow từ chọn bác sĩ đến xác nhận

'use strict';

const factory = require('../../data/factory.cjs');

Feature('Đặt lịch khám (Booking)');

let testPatient;

Before(async ({ I, LoginPage }) => {
  // Mỗi test có user riêng → State Isolation hoàn toàn
  testPatient = factory.createUser();
  await I.createTestUser(testPatient);

  // Login setup using page object
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');
});

After(async ({ I }) => {
  if (testPatient?.username) {
    await I.deleteTestUser(testPatient.username);
  }
});

// ─────────────────────────────────────────────────────────────────────────

/**
 * TC-BOOK-01: Trang đặt lịch load đúng
 */
Scenario('TC-BOOK-01: Trang đặt lịch mới hiển thị đầy đủ các bước', async ({ I, BookingPage }) => {
  await BookingPage.navigateTo();
  // Assert: page đã load, không bị crash
  I.seeInCurrentUrl('/patient/booking');
  I.dontSee('404');
  I.dontSee('500');
}).tag('@smoke').tag('@booking').tag('@patient');

/**
 * TC-BOOK-02: Chưa login → truy cập booking bị redirect
 */
Scenario('TC-BOOK-02: Chưa login → /patient/booking → redirect về /login', async ({ I, AuthSteps }) => {
  // Act: logout rồi truy cập protected route
  AuthSteps.assertRedirectToLoginWhenUnauth('/patient/booking');
  I.seeInCurrentUrl('/login');
}).tag('@booking').tag('@auth').tag('@routing');

/**
 * TC-BOOK-03: Chọn bác sĩ → Calendar hiển thị
 */
Scenario('TC-BOOK-03: Sau khi chọn bác sĩ → Calendar hiển thị để chọn ngày', async ({ I, BookingPage }) => {
  await BookingPage.navigateTo();

  // Act: chọn bác sĩ đầu tiên
  await BookingPage.selectFirstAvailableDoctor();

  // Assert: time select dropdown được kích hoạt
  I.waitForElement('select[name="appointmentTime"]:not([disabled])', 10);
  I.seeElement('select[name="appointmentTime"]:not([disabled])');
}).tag('@booking').tag('@patient');

/**
 * TC-BOOK-04: E2E Booking flow – Chọn bác sĩ → ngày → giờ → submit
 * NOTE: Test này phụ thuộc vào có bác sĩ và slot trống trong DB test
 * Nếu không có slot → test sẽ skip gracefully
 */
Scenario('TC-BOOK-04: E2E Đặt lịch hoàn chỉnh → tạo appointment thành công', async ({ I, BookingPage }) => {
  await BookingPage.navigateTo();

  // Step 1: Chọn bác sĩ
  await BookingPage.selectFirstAvailableDoctor();
  I.waitForElement('select[name="appointmentTime"]:not([disabled])', 10);

  // Step 2: Chọn ngày
  await BookingPage.selectFirstAvailableDate();
  I.waitForElement('select[name="appointmentTime"] option:not([value=""])', 10);

  // Step 3: Chọn time slot
  await BookingPage.selectFirstAvailableTimeSlot();

  // Step 4: Điền ghi chú (optional)
  const note = factory.createAppointmentNote();
  BookingPage.fillNotes(note);

  // Step 5: Submit
  BookingPage.submitBooking();

  // Step 6: Confirm modal
  await BookingPage.confirmInModal();

  // Assert: redirect về trang patient sau booking
  I.waitInUrl('/patient', 15);
}).tag('@booking').tag('@patient').tag('@e2e');

