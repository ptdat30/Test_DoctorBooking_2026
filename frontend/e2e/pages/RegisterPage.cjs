// e2e/pages/RegisterPage.js
// Page Object Model cho form Đăng ký trong Auth.jsx

'use strict';

/**
 * RegisterPage – Bao gồm toàn bộ selectors và actions của form /register
 * Selector nguồn: Auth.jsx (id="register-*")
 */
const { I } = inject();

module.exports = {
  // ── Locators ──────────────────────────────────────────────────────────────
  fields: {
    fullName:  '#register-fullName',
    username:  '#register-username',
    email:     '#register-email',
    password:  '#register-password',
    phone:     '#register-phone',
    submitBtn: '.auth-form-wrapper:not(.active) + .auth-form-wrapper.active button[type="submit"], .auth-form-wrapper.active button[type="submit"]',
  },

  toggles: {
    signUp: '.auth-mode-toggle button:last-child',
  },

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Điều hướng đến trang register và đợi form
   */
  async navigateTo() {
    I.amOnPage('/register');
    I.waitForElement(this.fields.fullName, 10);
  },

  /**
   * Điền form đăng ký với dữ liệu từ factory
   * @param {{ fullName: string, username: string, email: string, password: string, phone?: string }} userData
   */
  fillForm(userData) {
    I.clearField(this.fields.fullName);
    I.fillField(this.fields.fullName, userData.fullName);

    I.clearField(this.fields.username);
    I.fillField(this.fields.username, userData.username);

    I.clearField(this.fields.email);
    I.fillField(this.fields.email, userData.email);

    I.clearField(this.fields.password);
    I.fillField(this.fields.password, userData.password);

    if (userData.phone) {
      I.clearField(this.fields.phone);
      I.fillField(this.fields.phone, userData.phone);
    }
  },

  /**
   * Submit form đăng ký
   */
  submit() {
    // Tìm button submit trong form wrapper đang active
    I.click('button[type="submit"]', '.auth-form-wrapper.active');
  },

  /**
   * Register flow đầy đủ = navigate + fill + submit
   */
  async register(userData) {
    await this.navigateTo();
    this.fillForm(userData);
    this.submit();
  },

  /**
   * Kiểm tra thông báo lỗi validation
   */
  seeError(errorText) {
    I.waitForText(errorText, 5);
  },

  /**
   * Kiểm tra redirect sau khi register thành công
   */
  seeSuccessRedirect() {
    I.waitForNavigation({ timeout: 10000 });
    I.seeInCurrentUrl('/patient/dashboard');
  },
};
