// e2e/pages/PatientDashboardPage.js
// Page Object Model cho trang Patient Dashboard (/patient/dashboard)

'use strict';

const { I } = inject();

module.exports = {
  // ── Locators ──────────────────────────────────────────────────────────────
  // Dựa trên PatientDashboard.jsx
  layout: {
    sidebar:    '.sidebar, [class*="sidebar"]',
    mainContent: '.main-content, [class*="main-content"]',
    welcomeMsg:  'h1, h2, [class*="welcome"]',
  },

  stats: {
    container:    '[class*="stats"], [class*="stat-card"]',
    appointmentCount: '[class*="appointment"] [class*="count"], [class*="stat"]',
  },

  appointments: {
    upcomingList:  '[class*="upcoming"], [class*="appointment-list"]',
    appointmentCard: '[class*="appointment-card"], [class*="booking-card"]',
    noDataMsg:     '[class*="empty"], [class*="no-data"]',
  },

  nav: {
    newBookingBtn:  'a[href*="new-booking"], button[class*="booking"]',
    logoutBtn:      'button[class*="logout"], [class*="logout"]',
  },

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Đợi dashboard load hoàn toàn sau khi login
   */
  waitForLoad() {
    I.waitForNavigation({ timeout: 15000 });
    I.seeInCurrentUrl('/patient/dashboard');
    // Đợi sidebar xuất hiện – dấu hiệu app đã render xong
    I.waitForElement(this.layout.sidebar, 10);
  },

  /**
   * Kiểm tra dashboard hiển thị đúng
   */
  seeDashboardLoaded() {
    I.dontSee('404');
    I.dontSee('Unauthorized');
    I.seeInCurrentUrl('/patient/dashboard');
  },

  /**
   * Kiểm tra có stats card
   */
  seeStatsSection() {
    I.waitForElement(this.stats.container, 5);
    I.seeElement(this.stats.container);
  },

  /**
   * Click vào button Đặt lịch mới
   */
  clickNewBooking() {
    I.click(this.nav.newBookingBtn);
    I.waitForNavigation({ timeout: 5000 });
  },

  /**
   * Logout
   */
  logout() {
    I.click(this.nav.logoutBtn);
    I.waitForNavigation({ timeout: 5000 });
  },
};
