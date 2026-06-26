// e2e/steps/AuthSteps.js
// Step Object – Bọc các luồng Auth lặp đi lặp lại thành reusable steps
// Dùng chung qua nhiều test file, tái sử dụng được khi chạy parallel

'use strict';

const { I, LoginPage } = inject();

/**
 * AuthSteps – Các bước liên quan đến Authentication
 * Ưu điểm: Một thay đổi ở đây → cập nhật toàn bộ test files tự động
 */
module.exports = {
  /**
   * Đăng nhập với vai trò Patient
   * Tạo user thật qua ApiHelper trước khi gọi
   * @param {string} username
   * @param {string} password
   */
  async loginAsPatient(username, password) {
    await LoginPage.navigateTo();
    LoginPage.fillCredentials(username, password);
    LoginPage.submit();
    // Dùng waitForText thông minh, không wait() cứng
    I.waitForNavigation({ timeout: 10000 });
    I.seeInCurrentUrl('/patient/dashboard');
  },

  /**
   * Đăng nhập với vai trò Doctor
   */
  async loginAsDoctor(username, password) {
    await LoginPage.navigateTo();
    LoginPage.fillCredentials(username, password);
    LoginPage.submit();
    I.waitForNavigation({ timeout: 10000 });
    I.seeInCurrentUrl('/doctor/dashboard');
  },

  /**
   * Đăng nhập với vai trò Admin
   */
  async loginAsAdmin(username, password) {
    await LoginPage.navigateTo();
    LoginPage.fillCredentials(username, password);
    LoginPage.submit();
    I.waitForNavigation({ timeout: 10000 });
    I.seeInCurrentUrl('/admin/dashboard');
  },

  /**
   * Đăng xuất khỏi bất kỳ dashboard nào
   */
  logout() {
    // Dùng localStorage clear để đảm bảo state được reset hoàn toàn
    I.executeScript(() => {
      try {
        localStorage.clear();
        window.location.reload();
      } catch (e) {}
    });
    I.amOnPage('/login');
    I.waitForElement('#login-username', 5);
  },

  /**
   * Kiểm tra user chưa đăng nhập bị redirect về login
   * @param {string} protectedPath
   */
  assertRedirectToLoginWhenUnauth(protectedPath) {
    // Thiết lập origin trước
    I.amOnPage('/login');
    // Xóa token
    I.executeScript(() => {
      try {
        localStorage.clear();
        window.location.reload();
      } catch (e) {}
    });
    I.amOnPage(protectedPath);
    // Phải bị redirect về /login
    I.waitInUrl('/login', 5);
  },
};
