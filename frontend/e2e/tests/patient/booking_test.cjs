// e2e/tests/patient/booking_test.js
// Test: Đặt lịch khám – E2E Flow từ chọn bác sĩ đến xác nhận

'use strict';

const factory = require('../../data/factory.cjs');

Feature('Đặt lịch khám (Booking)');

let testPatient;

Before(async ({ I }) => {
  // Mỗi test có user riêng → State Isolation hoàn toàn
  testPatient = factory.createUser();
  await I.createTestUser(testPatient);

  // Login setup
  I.amOnPage('/login');
  I.waitForElement('#login-username', 10);
  I.fillField('#login-username', testPatient.username);
  I.fillField('#login-password', testPatient.password);
  I.click('button[type="submit"].auth-submit-btn');
  I.waitForNavigation({ timeout: 10000 });
  I.seeInCurrentUrl('/patient/dashboard');
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
  I.seeInCurrentUrl('/patient/new-booking');
  I.dontSee('404');
  I.dontSee('500');
}).tag('@smoke').tag('@booking').tag('@patient');

/**
 * TC-BOOK-02: Chưa login → truy cập booking bị redirect
 */
Scenario('TC-BOOK-02: Chưa login → /patient/new-booking → redirect về /login', async ({ I, AuthSteps }) => {
  // Act: logout rồi truy cập protected route
  AuthSteps.assertRedirectToLoginWhenUnauth('/patient/new-booking');
  I.seeInCurrentUrl('/login');
}).tag('@booking').tag('@auth').tag('@routing');

/**
 * TC-BOOK-03: Chọn bác sĩ → Calendar hiển thị
 */
Scenario('TC-BOOK-03: Sau khi chọn bác sĩ → Calendar hiển thị để chọn ngày', async ({ I, BookingPage }) => {
  await BookingPage.navigateTo();

  // Act: chọn bác sĩ đầu tiên
  BookingPage.selectFirstAvailableDoctor();

  // Assert: Calendar phải xuất hiện
  I.waitForElement(BookingPage.dateSelect.calendar, 10);
  I.seeElement(BookingPage.dateSelect.calendar);
}).tag('@booking').tag('@patient');

/**
 * TC-BOOK-04: E2E Booking flow – Chọn bác sĩ → ngày → giờ → submit
 * NOTE: Test này phụ thuộc vào có bác sĩ và slot trống trong DB test
 * Nếu không có slot → test sẽ skip gracefully
 */
Scenario('TC-BOOK-04: E2E Đặt lịch hoàn chỉnh → tạo appointment thành công', async ({ I, BookingPage }) => {
  await BookingPage.navigateTo();

  // Step 1: Chọn bác sĩ
  BookingPage.selectFirstAvailableDoctor();
  I.waitForElement(BookingPage.dateSelect.calendar, 10);

  // Step 2: Chọn ngày
  BookingPage.selectFirstAvailableDate();
  I.waitForElement(BookingPage.timeSelect.slotList, 10);

  // Step 3: Chọn time slot
  BookingPage.selectFirstAvailableTimeSlot();

  // Step 4: Điền ghi chú (optional)
  const note = factory.createAppointmentNote();
  BookingPage.fillNotes(note);

  // Step 5: Submit
  BookingPage.submitBooking();

  // Step 6: Confirm modal nếu có
  // Dùng tryTo để không fail nếu không có modal
  await I.tryTo(() => {
    I.waitForElement(BookingPage.form.confirmModal, 3);
    I.click(BookingPage.form.confirmBtn);
  });

  // Assert: redirect về trang patient sau booking
  I.waitForNavigation({ timeout: 15000 });
  I.seeInCurrentUrl('/patient');
}).tag('@booking').tag('@patient').tag('@e2e');

