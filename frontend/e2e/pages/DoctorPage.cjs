// e2e/pages/DoctorPage.cjs
// Page Object Model cho trang Bác sĩ (/doctor/appointments)

'use strict';

const { I } = inject();

module.exports = {
  // Locators
  locators: {
    form: {
      diagnosisCode: 'input[name="diagnosisCode"]',
      diagnosis: 'textarea[name="diagnosis"]',
      treatmentNotes: 'textarea[name="treatmentNotes"]',
      advice: 'textarea[name="advice"]',
      submitBtn: 'button.button-submit',
    }
  },

  // Actions
  navigateToAppointments() {
    I.amOnPage('/doctor/appointments');
    I.waitInUrl('/doctor/appointments', 10);
  },

  confirmAppointment(patientName) {
    const xpath = `//div[contains(@class, "appointment-card")][descendant::div[contains(@class, "patient-name")][contains(., "${patientName}")]]//button[contains(@class, "confirm-btn")]`;
    I.waitForElement(xpath, 10);
    I.click(xpath);
    I.waitForInvisible('//button[contains(text(), "Đang xác nhận...")]', 10);
  },

  cancelAppointment(patientName) {
    const xpath = `//div[contains(@class, "appointment-card")][descendant::div[contains(@class, "patient-name")][contains(., "${patientName}")]]//button[contains(@class, "cancel-btn")]`;
    I.waitForElement(xpath, 10);
    I.click(xpath);
    I.waitForElement('//h2[contains(text(), "Hủy Lịch Hẹn")]', 10);
    I.click('//label[contains(., "Bận công việc đột xuất")]');
    I.click('//button[contains(text(), "Xác nhận hủy")]');
    I.waitForInvisible('//h2[contains(text(), "Hủy Lịch Hẹn")]', 10);
  },

  clickTreatmentAppointment(patientName) {
    const xpath = `//div[contains(@class, "appointment-card")][descendant::div[contains(@class, "patient-name")][contains(., "${patientName}")]]//button[contains(@class, "treatment-btn")]`;
    I.waitForElement(xpath, 10);
    I.click(xpath);
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
  }
};
