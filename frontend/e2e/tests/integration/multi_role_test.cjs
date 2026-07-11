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
  await BookingPage.selectFirstAvailableDate();
  await BookingPage.selectFirstAvailableTimeSlot();
  BookingPage.fillNotes('Đau đầu kéo dài');
  BookingPage.submitBooking();
  await BookingPage.confirmInModal();

  I.waitInUrl('/patient/history', 20);
  I.see('Đang chờ'); // StatusBadge PENDING

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
  I.see('Đã xác nhận');
}).tag('@integration').tag('@patient').tag('@doctor');

Scenario('TC-INT-02: Bệnh nhân đặt lịch khám -> Bác sĩ từ chối (Hủy lịch)', async ({ I, LoginPage, BookingPage, DoctorPage }) => {
  // Lấy doctor ID của doctor1 để book đúng bác sĩ
  const doctorId = await resolveDoctor1Id(I);

  // Step 1: Bệnh nhân đặt lịch
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  await BookingPage.navigateTo();
  await BookingPage.selectDoctorById(doctorId);
  await BookingPage.selectFirstAvailableDate();
  await BookingPage.selectFirstAvailableTimeSlot();
  BookingPage.fillNotes('Đau bụng âm ỉ');
  BookingPage.submitBooking();
  await BookingPage.confirmInModal();

  I.waitInUrl('/patient/history', 20);

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
  I.see('Đã hủy');
}).tag('@integration').tag('@patient').tag('@doctor');

Scenario('TC-INT-03: Bác sĩ khám bệnh & kê đơn -> Bệnh nhân xem bệnh án', async ({ I, LoginPage, BookingPage, DoctorPage }) => {
  // Lấy doctor ID của doctor1 để book đúng bác sĩ
  const doctorId = await resolveDoctor1Id(I);

  // Step 1: Bệnh nhân đặt lịch
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  await BookingPage.navigateTo();
  await BookingPage.selectDoctorById(doctorId);
  await BookingPage.selectFirstAvailableDate();
  await BookingPage.selectFirstAvailableTimeSlot();
  BookingPage.fillNotes('Đau họng, sốt nhẹ');
  BookingPage.submitBooking();
  await BookingPage.confirmInModal();

  I.waitInUrl('/patient/history', 20);

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
  I.see('Viêm họng hạt cấp tính');
  I.click('//button[contains(., "Chi tiết")]');
  I.waitForText('Chi tiết điều trị', 10);
  I.see('Viêm họng hạt cấp tính');
  I.see('Uống nhiều nước ấm, súc họng nước muối');
}).tag('@integration').tag('@patient').tag('@doctor');
