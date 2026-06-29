// e2e/tests/blackbox/booking_bva_test.cjs
// Blackbox BVA: Appointment booking — past date, slot boundaries

'use strict';

const factory = require('../../data/factory.cjs');

Feature('Blackbox BVA — Appointment Booking @bva');

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

Scenario('APT-B0: Ngày quá khứ bị chặn (min=today + không có slot)', async ({ I, BookingPage }) => {
  await BookingPage.navigateTo();
  await BookingPage.selectFirstAvailableDoctor();

  // 1) Biên dưới: input ngày đặt min = hôm nay → trình duyệt chặn chọn ngày quá khứ
  const { min, today } = await I.executeScript(() => {
    const input = document.querySelector('input[name="appointmentDate"]');
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { min: input ? input.getAttribute('min') : null, today: todayStr };
  });
  if (min !== today) {
    throw new Error(`Expected appointmentDate min="${today}" nhưng nhận "${min}"`);
  }

  // 2) Ép chọn ngày hôm qua (bypass HTML5) → không có slot khả dụng nào (không thể đặt lịch quá khứ)
  await BookingPage.selectDateWithOffset(-1);
  I.wait(2);
  const hasSlots = await I.grabNumberOfVisibleElements('select[name="appointmentTime"] option:not([value=""])');
  if (hasSlots > 0) {
    throw new Error('Không được có slot khả dụng cho ngày quá khứ');
  }
}).tag('@bva').tag('@booking').tag('APT-B0');

Scenario('APT-B6/B7: Slot đầu 08:00 và cuối 17:00 có trong dropdown', async ({ I, BookingPage }) => {
  await BookingPage.navigateTo();
  await BookingPage.selectFirstAvailableDoctor();
  // Dùng ngày xa (+30) để chắc chắn bác sĩ chưa kín lịch → đủ 17 slot chuẩn (08:00..17:00)
  await BookingPage.selectDateWithOffset(30);

  I.waitForElement('select[name="appointmentTime"] option:not([value=""])', 15);
  I.see('08:00', 'select[name="appointmentTime"]');
  I.see('17:00', 'select[name="appointmentTime"]');
}).tag('@bva').tag('@booking').tag('APT-B6').tag('APT-B7');
