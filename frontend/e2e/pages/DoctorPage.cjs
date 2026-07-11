// e2e/pages/DoctorPage.cjs
// Page Object Model cho trang Bác sĩ (/doctor/appointments) — UI shell redesign

'use strict';

const { I } = inject();

module.exports = {
  locators: {
    form: {
      diagnosisCode: 'input[name="diagnosisCode"]',
      diagnosis: 'textarea[name="diagnosis"]',
      treatmentNotes: 'textarea[name="treatmentNotes"]',
      advice: 'textarea[name="advice"]',
      submitBtn: '//button[@form="treatment-form"][contains(., "Lưu điều trị")]',
    },
  },

  cardForPatient(patientName) {
    return `//article[contains(@class, "app-card")][.//p[contains(@class, "font-semibold")][contains(., "${patientName}")]]`;
  },

  navigateToAppointments() {
    I.amOnPage('/doctor/appointments');
    I.waitInUrl('/doctor/appointments', 10);
    I.waitForText('Lịch hẹn của tôi', 10);
  },

  confirmAppointment(patientName) {
    const card = this.cardForPatient(patientName);
    I.waitForElement(card, 15);
    I.scrollTo(card);
    const btn = `${card}//button[contains(., "Xác nhận")]`;
    I.waitForElement(btn, 10);
    I.click(btn);
    I.waitForInvisible('//button[contains(., "Đang xác nhận")]', 15);
  },

  cancelAppointment(patientName) {
    const card = this.cardForPatient(patientName);
    I.waitForElement(card, 15);
    I.scrollTo(card);
    const btn = `${card}//button[contains(., "Hủy lịch")]`;
    I.waitForElement(btn, 10);
    I.click(btn);
    I.waitForElement('//h2[contains(text(), "Hủy lịch hẹn")]', 10);
    I.click('//label[contains(., "Bận công việc đột xuất")]');
    I.click('//button[contains(., "Xác nhận hủy")]');
    I.waitForInvisible('//h2[contains(text(), "Hủy lịch hẹn")]', 10);
  },

  clickTreatmentAppointment(patientName) {
    const card = this.cardForPatient(patientName);
    I.waitForElement(card, 15);
    I.scrollTo(card);
    const btn = `${card}//button[contains(., "Tạo phiếu điều trị")]`;
    I.waitForElement(btn, 10);
    I.click(btn);
  },

  fillTreatmentForm(code, diagnosis, notes, advice) {
    I.waitForElement(this.locators.form.diagnosisCode, 10);
    I.fillField(this.locators.form.diagnosisCode, code);
    I.fillField(this.locators.form.diagnosis, diagnosis);
    I.fillField(this.locators.form.treatmentNotes, notes);
    I.fillField(this.locators.form.advice, advice);
  },

  submitTreatmentForm() {
    I.click(this.locators.form.submitBtn);
    I.waitForInvisible(this.locators.form.submitBtn, 10);
  },
};
