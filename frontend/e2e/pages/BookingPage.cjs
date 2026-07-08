// e2e/pages/BookingPage.js
// Page Object Model cho trang Đặt lịch khám (/patient/booking)

'use strict';

const { I } = inject();

module.exports = {
  // ── Locators ──────────────────────────────────────────────────────────────
  // Dựa trên NewBooking.jsx
  doctorSelect: {
    select:        'select[name="doctorId"]',
  },

  dateSelect: {
    input:         'input[name="appointmentDate"]',
  },

  timeSelect: {
    select:        'select[name="appointmentTime"]',
  },

  form: {
    notesInput:    'textarea[name="notes"]',
    submitBtn:     'button[type="submit"]',
    confirmModal:  '//h2[contains(text(), "Xem lại thông tin")]',
    confirmBtn:    '//div[contains(@class, "fixed") and contains(@class, "inset-0")]//div[contains(@class, "border-t")]//button[contains(., "Xác nhận đặt lịch")]',
  },

  feedback: {
    successMsg:    '[class*="success"], [class*="toast-success"]',
    errorMsg:      '[class*="error"], [class*="toast-error"]',
  },

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Điều hướng đến trang đặt lịch
   */
  async navigateTo() {
    I.amOnPage('/patient/booking');
    I.waitInUrl('/patient/booking', 10);
  },

  /**
   * Chọn bác sĩ đầu tiên có sẵn
   */
  async selectFirstAvailableDoctor() {
    I.waitForElement(this.doctorSelect.select, 10);
    const value = await I.executeScript(() => {
      const select = document.querySelector('select[name="doctorId"]');
      if (select && select.options.length > 1) {
        return select.options[1].value;
      }
      return null;
    });

    if (value) {
      I.selectOption(this.doctorSelect.select, value);
    } else {
      throw new Error("No doctors available in the dropdown!");
    }
  },

  /**
   * Chọn bác sĩ theo ID
   */
  selectDoctorById(id) {
    I.waitForElement(this.doctorSelect.select, 10);
    I.selectOption(this.doctorSelect.select, String(id));
    I.wait(1);
  },

  /**
   * Chọn ngày đầu tiên có thể đặt trong calendar
   */
  async selectFirstAvailableDate() {
    I.waitForElement(this.dateSelect.input, 10);
    for (let offset = 1; offset <= 7; offset++) {
      const target = new Date();
      target.setDate(target.getDate() + offset);
      const year = target.getFullYear();
      const month = String(target.getMonth() + 1).padStart(2, '0');
      const day = String(target.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      I.fillField(this.dateSelect.input, dateStr);
      I.wait(1);

      const hasSlots = await I.executeScript(() => {
        const select = document.querySelector('select[name="appointmentTime"]');
        return Boolean(select && select.options.length > 1);
      });
      if (hasSlots) return;
    }

    throw new Error('No available slots found in next 7 days');
  },

  /**
   * Chọn ngày với offset
   */
  async selectDateWithOffset(daysOffset) {
    I.waitForElement(this.dateSelect.input, 10);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysOffset);
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    I.fillField(this.dateSelect.input, dateStr);
    I.wait(1);
  },

  /**
   * Chọn slot thời gian đầu tiên có sẵn
   */
  async selectFirstAvailableTimeSlot() {
    I.waitForElement(this.timeSelect.select, 10);
    const value = await I.executeScript(() => {
      const select = document.querySelector('select[name="appointmentTime"]');
      if (select && select.options.length > 1) {
        return select.options[1].value;
      }
      return null;
    });

    if (value) {
      I.selectOption(this.timeSelect.select, value);
    } else {
      throw new Error("No time slots available in the dropdown!");
    }
  },

  /**
   * Điền ghi chú (optional)
   * @param {string} notes
   */
  fillNotes(notes) {
    if (notes) {
      I.fillField(this.form.notesInput, notes);
    }
  },

  /**
   * Submit form đặt lịch
   */
  submitBooking() {
    I.click(this.form.submitBtn);
  },

  /**
   * Xác nhận trong modal (nếu có)
   */
  confirmInModal() {
    I.waitForElement(this.form.confirmModal, 5);
    I.click(this.form.confirmBtn);
  },

  /**
   * Kiểm tra đặt lịch thành công
   */
  seeBookingSuccess() {
    I.waitInUrl('/patient', 15);
  },

  async selectTimeSlot(time) {
    I.waitForElement(this.timeSelect.select, 10);
    I.selectOption(this.timeSelect.select, time);
  },

  submitAndConfirm() {
    this.submitBooking();
    this.confirmInModal();
  },

  seeBookingError(errorText) {
    I.waitForText(errorText, 15);
  },

  seeFieldError(fieldName) {
    I.waitForElement('.field-error', 10);
    if (fieldName) {
      I.see(fieldName, '.field-error');
    }
  },
};
