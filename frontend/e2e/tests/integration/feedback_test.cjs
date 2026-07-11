// e2e/tests/integration/feedback_test.cjs
// Test tích hợp đánh giá & phản hồi giữa Bệnh nhân ⇆ Bác sĩ ⇆ Admin

'use strict';

const factory = require('../../data/factory.cjs');
const { resolveDoctor1Id } = require('../../helpers/doctorResolver.cjs');

Feature('Tích hợp Đánh giá & Phản hồi (Feedback System)');

let testPatient;

Before(async ({ I }) => {
  testPatient = factory.createUser();
  await I.createTestUser(testPatient);
});

After(async ({ I }) => {
  if (testPatient?.username) {
    await I.deleteTestUser(testPatient.username);
  }
});

Scenario('TC-FEEDBACK-ALL: Luồng gửi đánh giá -> Bác sĩ phản hồi -> Admin ẩn đánh giá', async ({ I, LoginPage, BookingPage, DoctorPage, FeedbackPage, AdminPage }) => {
  // --- BƯỚC 1: Bệnh nhân đặt lịch khám ---
  const doctorId = await resolveDoctor1Id(I);

  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  await BookingPage.navigateTo();
  await BookingPage.selectDoctorById(doctorId);
  await BookingPage.selectFirstAvailableDate();
  await BookingPage.selectFirstAvailableTimeSlot();
  BookingPage.fillNotes('Khám đau họng');
  BookingPage.submitBooking();
  await BookingPage.confirmInModal();
  I.waitInUrl('/patient/history', 20);

  // Logout bệnh nhân
  I.executeScript(() => {
    localStorage.clear();
    window.location.reload();
  });
  I.waitInUrl('/login', 10);

  // --- BƯỚC 2: Bác sĩ xác nhận lịch và hoàn thành khám (tạo treatment) ---
  await LoginPage.login('doctor1', 'password123');
  LoginPage.seeSuccessRedirect('doctor');

  await DoctorPage.navigateToAppointments();
  await DoctorPage.confirmAppointment(testPatient.fullName);

  // Reload để nút "Tạo phiếu khám" xuất hiện
  I.refreshPage();
  I.waitInUrl('/doctor/appointments', 10);

  await DoctorPage.clickTreatmentAppointment(testPatient.fullName);
  await DoctorPage.fillTreatmentForm('K21.9', 'Trào ngược dạ dày', 'Ăn uống đúng giờ, tránh thức khuya', 'Uống thuốc trước ăn 30p');
  await DoctorPage.submitTreatmentForm();

  // Logout bác sĩ
  I.executeScript(() => {
    localStorage.clear();
    window.location.reload();
  });
  I.waitInUrl('/login', 10);

  // --- BƯỚC 3: Bệnh nhân viết đánh giá cho lịch khám COMPLETED ---
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  FeedbackPage.navigateToNewFeedback();
  const feedbackComment = 'Bác sĩ khám nhiệt tình và tư vấn kỹ càng - ' + factory.createAppointmentNote();
  // Gửi feedback 5 sao
  await FeedbackPage.submitFeedback(5, feedbackComment);

  // Logout bệnh nhân
  I.executeScript(() => {
    localStorage.clear();
    window.location.reload();
  });
  I.waitInUrl('/login', 10);

  // --- BƯỚC 4: Bác sĩ xem và phản hồi lại đánh giá của bệnh nhân ---
  await LoginPage.login('doctor1', 'password123');
  LoginPage.seeSuccessRedirect('doctor');

  FeedbackPage.navigateToDoctorFeedbacks();
  const doctorReplyText = 'Cảm ơn bạn đã tin tưởng và đánh giá tốt!';
  await FeedbackPage.replyToFeedback(testPatient.fullName, doctorReplyText);

  // Kiểm tra xem phản hồi hiển thị đúng
  FeedbackPage.seeReplyOnDoctorPage(testPatient.fullName, doctorReplyText);

  // Logout bác sĩ
  I.executeScript(() => {
    localStorage.clear();
    window.location.reload();
  });
  I.waitInUrl('/login', 10);

  // --- BƯỚC 5: Admin duyệt và ẩn đánh giá đó ---
  await LoginPage.login('admin', 'admin123');
  LoginPage.seeSuccessRedirect('admin');

  FeedbackPage.navigateToAdminFeedbacks();
  FeedbackPage.filterAdminFeedbacks(testPatient.fullName);
  await FeedbackPage.hideFeedback(testPatient.fullName);

  // Kiểm tra badge "Đã ẩn" được hiển thị
  FeedbackPage.seeHiddenBadge(testPatient.fullName);
}).tag('@integration').tag('@feedback').tag('@patient').tag('@doctor').tag('@admin');
