// e2e/pages/BookingPage.js
// Page Object Model cho trang Đặt lịch khám (/patient/new-booking)

'use strict';

const { I } = inject();

module.exports = {
  // ── Locators ──────────────────────────────────────────────────────────────
  // Dựa trên NewBooking.jsx
  doctorSelect: {
    searchInput:   'input[placeholder*="doctor"], input[placeholder*="bác sĩ"]',
    doctorCard:    '[class*="doctor-card"], [class*="doctor-option"]',
    selectedBadge: '[class*="selected-doctor"]',
  },

  dateSelect: {
    calendar:      '[class*="calendar"], [class*="date-picker"]',
    dayCell:       '[class*="day"]:not([class*="disabled"]):not([class*="past"])',
    selectedDay:   '[class*="day"][class*="selected"]',
  },

  timeSelect: {
    slotList:      '[class*="time-slot"], [class*="slot-list"]',
    availableSlot: '[class*="slot"]:not([class*="disabled"]):not([class*="booked"])',
    selectedSlot:  '[class*="slot"][class*="selected"]',
  },

  form: {
    notesInput:    'textarea[name*="note"], textarea[placeholder*="note"]',
    submitBtn:     'button[type="submit"], button[class*="confirm"], button[class*="book"]',
    confirmModal:  '[class*="modal"], [class*="confirm-dialog"]',
    confirmBtn:    '[class*="modal"] button[class*="confirm"], [class*="confirm-dialog"] button',
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
    I.amOnPage('/patient/new-booking');
    I.waitForNavigation({ timeout: 10000 });
  },

  /**
   * Chọn bác sĩ đầu tiên có sẵn
   */
  selectFirstAvailableDoctor() {
    I.waitForElement(this.doctorSelect.doctorCard, 10);
    I.click(this.doctorSelect.doctorCard);
  },

  /**
   * Chọn ngày đầu tiên có thể đặt trong calendar
   */
  selectFirstAvailableDate() {
    I.waitForElement(this.dateSelect.calendar, 10);
    I.click(this.dateSelect.dayCell);
  },

  /**
   * Chọn slot thời gian đầu tiên có sẵn
   */
  selectFirstAvailableTimeSlot() {
    I.waitForElement(this.timeSelect.availableSlot, 10);
    I.click(this.timeSelect.availableSlot);
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
    // Đợi redirect hoặc success message
    I.waitForNavigation({ timeout: 15000 });
    // Có thể redirect về booking history hoặc dashboard
    I.seeInCurrentUrl('/patient');
  },
};
