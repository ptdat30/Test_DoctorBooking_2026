// e2e/tests/integration/family_booking_test.cjs
// Test tích hợp Đặt lịch cho người nhà (Family Profile Booking)

'use strict';

const factory = require('../../data/factory.cjs');

Feature('Tích hợp Đặt lịch cho người nhà (Family Profile Booking)');

let testPatient;
const familyMemberName = 'Baby Gibson';

Before(async ({ I, LoginPage }) => {
  testPatient = factory.createUser();
  await I.createTestUser(testPatient);
});

After(async ({ I }) => {
  if (testPatient?.username) {
    await I.deleteTestUser(testPatient.username);
  }
});

// ─────────────────────────────────────────────────────────────────────────

Scenario('TC-INT-04: Thêm người nhà vào Hồ sơ -> Đặt lịch khám cho người nhà thành công', async ({ I, LoginPage, BookingPage }) => {
  // Step 1: Đăng nhập Patient
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  // Step 2: Truy cập Hồ sơ gia đình và thêm thành viên mới
  I.amOnPage('/patient/family');
  I.waitInUrl('/patient/family', 10);
  I.waitForElement('.btn-add-member', 10);
  I.click('.btn-add-member');

  // Chờ modal xuất hiện
  I.waitForElement('input[placeholder="Nhập họ và tên"]', 10);
  I.fillField('input[placeholder="Nhập họ và tên"]', familyMemberName);
  I.selectOption('//select[option[@value="CHILD"]]', 'CHILD'); // Con cái
  I.selectOption('//select[option[@value="MALE"]]', 'MALE'); // Nam

  // Set date of birth via JavaScript to avoid locale format issues
  I.executeScript(() => {
    const input = document.querySelector('.modal-content input[type="date"]');
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '2020-05-15');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  I.fillField('textarea[placeholder*="Nhập tiền sử bệnh"]', 'Dị ứng phấn hoa');

  I.click('button.btn-submit');

  // Chờ modal đóng và card thành viên xuất hiện
  I.waitForElement('//h3[contains(@class, "member-name")][contains(., "' + familyMemberName + '")]', 15);
  I.see(familyMemberName, '.members-grid');

  // Step 3: Đặt lịch khám cho người nhà
  // Lấy doctor ID của doctor1
  const doctors = await I.getDoctors();
  const targetDoctor = doctors.find(d => d.username === 'doctor1');
  const doctorId = targetDoctor ? targetDoctor.id : 36;

  await BookingPage.navigateTo();

  // Chọn "Who is this for?" là người nhà (Baby Gibson)
  I.waitForElement('//div[contains(@class, "patient-option-name")][contains(., "' + familyMemberName + '")]', 10);
  I.click('//div[contains(@class, "patient-option-name")][contains(., "' + familyMemberName + '")]');

  // Chọn bác sĩ, ngày (offset 3 để tránh trùng lặp ngày/giờ với các test khác), giờ
  await BookingPage.selectDoctorById(doctorId);
  await BookingPage.selectDateWithOffset(Math.floor(Math.random() * 10) + 54);

  I.waitForElement('select[name="appointmentTime"] option:not([value=""])', 10);
  await BookingPage.selectFirstAvailableTimeSlot();
  BookingPage.fillNotes('Khám ho và sốt nhẹ');
  BookingPage.submitBooking();

  // Xác nhận trong Review Modal hiển thị đúng tên người nhà
  I.waitForElement('//h2[contains(text(), "Review Booking Details")]', 10);
  I.see(familyMemberName, '.fixed');

  // Xác nhận đặt lịch
  I.click('//div[contains(@class, "fixed")]//button[contains(text(), "Confirm booking")]');

  I.waitInUrl('/patient/history', 15);
  I.see('PENDING', '.status-badge');
}).tag('@integration').tag('@patient').tag('@family');
