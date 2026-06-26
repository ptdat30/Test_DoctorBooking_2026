// e2e/pages/DoctorSearchPage.js
// Page Object Model cho trang Tìm kiếm bác sĩ (/patient/doctors hoặc /doctors)

'use strict';

const { I } = inject();

module.exports = {
  // ── Locators ──────────────────────────────────────────────────────────────
  // Dựa trên DoctorSearch.jsx
  search: {
    input:       '#doctor-search-input',
    submitBtn:   'button[type="submit"], button[class*="search"]',
    clearBtn:    'button[class*="clear"]',
  },

  filters: {
    specialtySelect:  'select[class*="specialty"], select[name*="specialty"]',
    specialtyOptions: 'select[class*="specialty"] option',
  },

  results: {
    doctorList:   'table',
    doctorCard:   '//tbody/tr[td//button[@title="Đặt lịch"]]',
    doctorName:   'tbody tr td:nth-child(2)',
    bookBtn:      'button[title="Đặt lịch"]',
    emptyState:   '//td[contains(., "Không tìm thấy bác sĩ nào")]',
    loadingState: 'div.animate-spin',
  },

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Điều hướng đến trang tìm kiếm bác sĩ
   */
  async navigateTo() {
    I.amOnPage('/patient/doctors');
    I.waitForElement(this.search.input, 10);
  },

  /**
   * Tìm kiếm bác sĩ theo tên
   * @param {string} query
   */
  searchDoctor(query) {
    I.clearField(this.search.input);
    I.fillField(this.search.input, query);
    // Trigger search bằng Enter hoặc click button
    I.pressKey('Enter');
    // Đợi loading biến mất thay vì wait() cứng
    I.waitForInvisible(this.results.loadingState, 10);
  },

  /**
   * Filter theo chuyên khoa
   * @param {string} specialtyValue
   */
  filterBySpecialty(specialtyValue) {
    I.selectOption(this.filters.specialtySelect, specialtyValue);
    I.waitForInvisible(this.results.loadingState, 10);
  },

  /**
   * Kiểm tra có kết quả tìm kiếm
   */
  seeSearchResults() {
    I.waitForElement(this.results.doctorCard, 10);
    I.seeElement(this.results.doctorCard);
  },

  /**
   * Kiểm tra thấy tên bác sĩ cụ thể trong kết quả
   * @param {string} doctorName
   */
  seeDoctorInResults(doctorName) {
    I.waitForText(doctorName, 10);
  },

  /**
   * Kiểm tra không có kết quả
   */
  seeEmptyState() {
    I.waitForElement(this.results.emptyState, 10);
  },

  /**
   * Click vào nút Đặt lịch của bác sĩ đầu tiên
   */
  bookFirstDoctor() {
    I.waitForElement(this.results.bookBtn, 10);
    I.click(this.results.bookBtn);
    I.waitForNavigation({ timeout: 5000 });
  },
};
