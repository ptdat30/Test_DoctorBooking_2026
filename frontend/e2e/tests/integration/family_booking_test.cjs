// e2e/tests/integration/family_booking_test.cjs
// Test tích hợp Đặt lịch cho người nhà (Family Profile Booking)

'use strict';

const factory = require('../../data/factory.cjs');
const { resolveDoctor1Id } = require('../../helpers/doctorResolver.cjs');

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
  await I.acceptBrowserDialogs();

  // Step 1: Đăng nhập Patient
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  // Step 2: Truy cập Hồ sơ gia đình và thêm thành viên mới
  I.amOnPage('/patient/family');
  I.waitInUrl('/patient/family', 10);
  I.waitForElement('//button[contains(., "Thêm thành viên")]', 10);
  I.click('//button[contains(., "Thêm thành viên")]');

  // Chờ modal xuất hiện
  I.waitForElement('input[placeholder="Nhập họ và tên"]', 10);
  I.fillField('input[placeholder="Nhập họ và tên"]', familyMemberName);
  I.selectOption('//form[@id="family-member-form"]//select[option[@value="CHILD"]]', 'CHILD');
  I.selectOption('//form[@id="family-member-form"]//select[option[@value="MALE"]]', 'MALE');

  // Set date of birth via JavaScript to avoid locale format issues
  I.executeScript(() => {
    const input = document.querySelector('#family-member-form input[type="date"]');
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '2020-05-15');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  I.fillField('textarea[placeholder*="Nhập tiền sử bệnh"]', 'Dị ứng phấn hoa');
  I.click('//button[@form="family-member-form"]');

  // Chờ modal đóng và card thành viên xuất hiện
  I.waitForInvisible('input[placeholder="Nhập họ và tên"]', 20);
  I.waitForText(familyMemberName, 20);

  // Step 3: Đặt lịch khám cho người nhà
  const doctorId = await resolveDoctor1Id(I);

  await BookingPage.navigateTo();

  // Chọn người nhà trong ChoiceCard
  I.waitForElement(`//p[contains(@class, "font-semibold")][contains(., "${familyMemberName}")]`, 10);
  I.click(`//p[contains(@class, "font-semibold")][contains(., "${familyMemberName}")]`);

  // Chọn bác sĩ, ngày có slot, giờ
  await BookingPage.selectDoctorById(doctorId);
  await BookingPage.selectFirstAvailableDate();
  await BookingPage.selectFirstAvailableTimeSlot();
  BookingPage.fillNotes('Khám ho và sốt nhẹ');
  BookingPage.submitBooking();

  // Xác nhận trong Review Modal
  I.waitForElement('//h2[contains(text(), "Xem lại thông tin")]', 10);
  I.see(familyMemberName);

  I.click('//div[contains(@class, "fixed")]//button[contains(., "Xác nhận đặt lịch")]');

  I.waitInUrl('/patient/history', 20);
  I.see('Đang chờ');
}).tag('@integration').tag('@patient').tag('@family');
