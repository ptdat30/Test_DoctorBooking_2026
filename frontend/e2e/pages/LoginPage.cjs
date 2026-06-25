// e2e/pages/LoginPage.js
// Page Object Model cho trang Login/Auth
// Tách biệt hoàn toàn locators và actions khỏi test files

'use strict';

/**
 * LoginPage – Bao gồm toàn bộ selectors và actions của trang /login
 * Selector nguồn: Auth.jsx (id="login-username", id="login-password")
 */
const { I } = inject();

module.exports = {
  // ── Locators ──────────────────────────────────────────────────────────────
  fields: {
    username:  '#login-username',
    password:  '#login-password',
    submitBtn: 'button[type="submit"].auth-submit-btn',
    errorMsg:  '.error-message, [class*="error"]',
  },

  toggles: {
    signIn:  '.auth-mode-toggle button:first-child',
    signUp:  '.auth-mode-toggle button:last-child',
  },

  links: {
    backHome: 'a.auth-back-home',
  },

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Điều hướng đến trang login và đợi form xuất hiện
   */
  async navigateTo() {
    I.amOnPage('/login');
    // Dùng waitForElement thay vì wait() cứng – chống flaky
    I.waitForElement(this.fields.username, 10);
    I.waitForElement(this.fields.password, 10);
  },

  /**
   * Điền thông tin đăng nhập
   * @param {string} username
   * @param {string} password
   */
  fillCredentials(username, password) {
    I.clearField(this.fields.username);
    I.fillField(this.fields.username, username);
    I.clearField(this.fields.password);
    I.fillField(this.fields.password, password);
  },

  /**
   * Click nút submit
   */
  submit() {
    I.click(this.fields.submitBtn);
  },

  /**
   * Login nhanh = fill + submit
   */
  async login(username, password) {
    await this.navigateTo();
    this.fillCredentials(username, password);
    this.submit();
  },

  /**
   * Kiểm tra thông báo lỗi hiển thị
   * @param {string} errorText
   */
  seeError(errorText) {
    I.waitForText(errorText, 5);
  },

  /**
   * Kiểm tra đã redirect đúng trang sau login thành công
   * @param {'patient'|'doctor'|'admin'} role
   */
  seeSuccessRedirect(role) {
    const routes = {
      patient: '/patient/dashboard',
      doctor:  '/doctor/dashboard',
      admin:   '/admin/dashboard',
    };
    I.waitForNavigation({ timeout: 10000 });
    I.seeInCurrentUrl(routes[role]);
  },
};
