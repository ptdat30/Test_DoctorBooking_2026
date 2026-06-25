// e2e/pages/HomePage.js
// Page Object Model cho trang Public Homepage (/)

'use strict';

const { I } = inject();

module.exports = {
  // ── Locators ──────────────────────────────────────────────────────────────
  nav: {
    loginLink:    'a[href="/login"], a[href*="login"]',
    registerLink: 'a[href="/register"], a[href*="register"]',
    doctorsLink:  'a[href="/doctors"], a[href*="doctors"]',
  },

  hero: {
    // CTA buttons thường ở hero section
    getStartedBtn: 'a[href="/register"], button',
    findDoctorBtn: 'a[href="/doctors"]',
  },

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Điều hướng đến Homepage và chờ page load xong
   */
  async navigateTo() {
    I.amOnPage('/');
    I.waitForURL('http://localhost:5173/', 10);
  },

  /**
   * Kiểm tra Homepage đã load đầy đủ
   */
  seePageLoaded() {
    // Kiểm tra page đã render (không bị crash, không có lỗi 404/500)
    I.dontSee('404');
    I.dontSee('Not Found');
    I.dontSee('Internal Server Error');
    // Kiểm tra có body content
    I.seeElement('body');
  },

  /**
   * Click vào link Login
   */
  clickLogin() {
    I.click(this.nav.loginLink);
    I.waitForURL('**/login', 5);
  },

  /**
   * Click vào link Register
   */
  clickRegister() {
    I.click(this.nav.registerLink);
    I.waitForURL('**/register', 5);
  },

  /**
   * Kiểm tra các navigation link hiển thị đúng
   */
  seeNavLinks() {
    I.seeElement(this.nav.loginLink);
    I.seeElement(this.nav.registerLink);
  },
};
