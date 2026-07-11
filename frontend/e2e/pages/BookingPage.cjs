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
  async selectDoctorById(id) {
    I.waitForElement(this.doctorSelect.select, 10);
    await I.usePlaywrightTo(`select doctor ${id}`, async ({ page }) => {
      await page.locator('select[name="doctorId"]').selectOption(String(id));
    });
    I.wait(1);
  },

  /**
   * Chọn ngày đầu tiên có thể đặt trong calendar
   */
  async selectFirstAvailableDate() {
    I.waitForElement(this.dateSelect.input, 10);
    // Offset ngẫu nhiên để giảm đụng slot giữa các scenario chạy tuần tự
    const start = 2 + Math.floor(Math.random() * 10);
    for (let offset = start; offset <= start + 18; offset++) {
      await this.selectDateWithOffset(offset);

      const hasSlots = await I.executeScript(() => {
        const select = document.querySelector('select[name="appointmentTime"]');
        return Boolean(select && select.options.length > 1);
      });
      if (hasSlots) return;
    }

    throw new Error('No available slots found in search window');
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

    // Playwright fill() cập nhật đúng controlled React input (tránh synthetic Event không sync state)
    await I.usePlaywrightTo(`set appointment date ${dateStr}`, async ({ page }) => {
      const input = page.locator('input[name="appointmentDate"]');
      await input.fill(dateStr);
      await input.dispatchEvent('change');
    });
    I.wait(1.5);
  },

  /**
   * Chọn slot thời gian đầu tiên có sẵn
   */
  async selectFirstAvailableTimeSlot() {
    I.waitForElement(this.timeSelect.select, 10);
    const value = await I.executeScript(() => {
      const select = document.querySelector('select[name="appointmentTime"]');
      if (!select || select.options.length <= 1) return null;
      const options = Array.from(select.options).filter((o) => o.value);
      if (options.length === 0) return null;
      // Chọn slot ngẫu nhiên để tránh trùng giờ giữa các test
      const idx = Math.floor(Math.random() * options.length);
      return options[idx].value;
    });

    if (value) {
      await I.usePlaywrightTo(`select time ${value}`, async ({ page }) => {
        await page.locator('select[name="appointmentTime"]').selectOption(String(value));
      });
    } else {
      throw new Error('No time slots available in the dropdown!');
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
   * Xác nhận trong modal. Nếu API lỗi (trùng slot…), chọn lại ngày/giờ và thử lại.
   */
  async confirmInModal(maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      I.waitForElement(this.form.confirmModal, 5);
      I.click(this.form.confirmBtn);

      const closed = await tryTo(() => I.waitForInvisible(this.form.confirmModal, 12));
      if (closed) return;

      if (attempt === maxAttempts) {
        throw new Error(`Booking confirm failed after ${maxAttempts} attempts (modal still open)`);
      }

      // Đóng modal → chọn slot khác → submit lại
      I.click('//div[contains(@class, "fixed")]//button[contains(., "Chỉnh sửa")]');
      I.waitForInvisible(this.form.confirmModal, 5);
      await this.selectFirstAvailableDate();
      await this.selectFirstAvailableTimeSlot();
      this.submitBooking();
    }
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

  async submitAndConfirm() {
    this.submitBooking();
    await this.confirmInModal();
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
