// e2e/tests/integration/multi_role_test.cjs
// Test tích hợp Bệnh nhân ⇆ Bác sĩ

'use strict';

const factory = require('../../data/factory.cjs');
const { resolveDoctor1Id } = require('../../helpers/doctorResolver.cjs');

Feature('Tích hợp Đặt lịch & Khám bệnh (Patient <-> Doctor)');

let testPatient;

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

Scenario('TC-INT-01: Bệnh nhân đặt lịch khám -> Bác sĩ duyệt thành công', async ({ I, LoginPage, BookingPage, DoctorPage }) => {
  // Lấy doctor ID của doctor1 để book đúng bác sĩ
  const doctorId = await resolveDoctor1Id(I);

  // Step 1: Bệnh nhân đặt lịch
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  await BookingPage.navigateTo();
  await BookingPage.selectDoctorById(doctorId);
  await BookingPage.selectDateWithOffset(Math.floor(Math.random() * 10) + 10); // Book 10-20 ngày tới để tránh trùng lịch hẹn cũ và 24h constraint

  // Chờ hiển thị danh sách giờ trống
  I.waitForElement('select[name="appointmentTime"] option:not([value=""])', 10);
  await BookingPage.selectFirstAvailableTimeSlot();
  BookingPage.fillNotes('Đau đầu kéo dài');
  BookingPage.submitBooking();
  BookingPage.confirmInModal();

  I.waitInUrl('/patient/history', 15);
  I.see('PENDING', '.status-badge'); // Assert trạng thái ban đầu là PENDING trong bảng lịch sử

  // Step 2: Logout bệnh nhân
  I.executeScript(() => {
    localStorage.clear();
    window.location.reload();
  });
  I.waitInUrl('/login', 10);

  // Step 3: Bác sĩ duyệt lịch hẹn
  await LoginPage.login('doctor1', 'password123');
  LoginPage.seeSuccessRedirect('doctor');

  await DoctorPage.navigateToAppointments();
  await DoctorPage.confirmAppointment(testPatient.fullName);

  // Step 4: Logout bác sĩ
  I.executeScript(() => {
    localStorage.clear();
    window.location.reload();
  });
  I.waitInUrl('/login', 10);

  // Step 5: Bệnh nhân kiểm tra lịch hẹn đã CONFIRMED
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  I.amOnPage('/patient/history');
  I.waitInUrl('/patient/history', 10);
  I.see('CONFIRMED', '.status-badge');
}).tag('@integration').tag('@patient').tag('@doctor');

Scenario('TC-INT-02: Bệnh nhân đặt lịch khám -> Bác sĩ từ chối (Hủy lịch)', async ({ I, LoginPage, BookingPage, DoctorPage }) => {
  // Lấy doctor ID của doctor1 để book đúng bác sĩ
  const doctorId = await resolveDoctor1Id(I);

  // Step 1: Bệnh nhân đặt lịch
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  await BookingPage.navigateTo();
  await BookingPage.selectDoctorById(doctorId);
  await BookingPage.selectDateWithOffset(Math.floor(Math.random() * 10) + 21); // Book 21-31 ngày tới để tránh trùng lịch hẹn cũ và 24h constraint

  I.waitForElement('select[name="appointmentTime"] option:not([value=""])', 10);
  await BookingPage.selectFirstAvailableTimeSlot();
  BookingPage.fillNotes('Đau bụng âm ỉ');
  BookingPage.submitBooking();
  BookingPage.confirmInModal();

  I.waitInUrl('/patient/history', 15);

  // Step 2: Logout bệnh nhân
  I.executeScript(() => {
    localStorage.clear();
    window.location.reload();
  });
  I.waitInUrl('/login', 10);

  // Step 3: Bác sĩ từ chối/hủy lịch hẹn
  await LoginPage.login('doctor1', 'password123');
  LoginPage.seeSuccessRedirect('doctor');

  await DoctorPage.navigateToAppointments();
  await DoctorPage.cancelAppointment(testPatient.fullName);

  // Step 4: Logout bác sĩ
  I.executeScript(() => {
    localStorage.clear();
    window.location.reload();
  });
  I.waitInUrl('/login', 10);

  // Step 5: Bệnh nhân kiểm tra lịch hẹn đã CANCELLED
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  I.amOnPage('/patient/history');
  I.waitInUrl('/patient/history', 10);
  I.see('CANCELLED', '.status-badge');
}).tag('@integration').tag('@patient').tag('@doctor');

Scenario('TC-INT-03: Bác sĩ khám bệnh & kê đơn -> Bệnh nhân xem bệnh án', async ({ I, LoginPage, BookingPage, DoctorPage }) => {
  // Lấy doctor ID của doctor1 để book đúng bác sĩ
  const doctorId = await resolveDoctor1Id(I);

  // Step 1: Bệnh nhân đặt lịch
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  await BookingPage.navigateTo();
  await BookingPage.selectDoctorById(doctorId);
  await BookingPage.selectDateWithOffset(Math.floor(Math.random() * 10) + 32); // Book 32-42 ngày tới để tránh trùng lịch hẹn cũ và 24h constraint

  I.waitForElement('select[name="appointmentTime"] option:not([value=""])', 10);
  await BookingPage.selectFirstAvailableTimeSlot();
  BookingPage.fillNotes('Đau họng, sốt nhẹ');
  BookingPage.submitBooking();
  BookingPage.confirmInModal();

  I.waitInUrl('/patient/history', 15);

  // Step 2: Logout bệnh nhân
  I.executeScript(() => {
    localStorage.clear();
    window.location.reload();
  });
  I.waitInUrl('/login', 10);

  // Step 3: Bác sĩ xác nhận lịch trước
  await LoginPage.login('doctor1', 'password123');
  LoginPage.seeSuccessRedirect('doctor');

  await DoctorPage.navigateToAppointments();
  await DoctorPage.confirmAppointment(testPatient.fullName);

  // Nút "Tạo phiếu điều trị" sẽ xuất hiện sau khi reload hoặc thay đổi trạng thái
  I.refreshPage();
  I.waitInUrl('/doctor/appointments', 10);

  // Step 4: Bác sĩ viết phiếu khám (Treatment/Prescription)
  await DoctorPage.clickTreatmentAppointment(testPatient.fullName);
  await DoctorPage.fillTreatmentForm('J02.9', 'Viêm họng hạt cấp tính', 'Uống nhiều nước ấm, súc họng nước muối', 'Nghỉ ngơi tại nhà 2 ngày');
  await DoctorPage.submitTreatmentForm();

  // Step 5: Logout bác sĩ
  I.executeScript(() => {
    localStorage.clear();
    window.location.reload();
  });
  I.waitInUrl('/login', 10);

  // Step 6: Bệnh nhân truy cập lịch sử điều trị
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  I.amOnPage('/patient/treatments');
  I.waitInUrl('/patient/treatments', 10);
  I.see('Viêm họng hạt cấp tính', 'table');
  I.click('View Details', 'table');
  I.waitForText('Treatment Details', 10);
  I.see('Viêm họng hạt cấp tính');
  I.see('Uống nhiều nước ấm, súc họng nước muối');
}).tag('@integration').tag('@patient').tag('@doctor');
