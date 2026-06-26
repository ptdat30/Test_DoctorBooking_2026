// e2e/pages/AdminPage.cjs
// Page Object Model cho trang Quản trị viên (/admin/users)

'use strict';

const { I } = inject();

module.exports = {
  // Locators
  locators: {
    searchBar: 'input[placeholder*="Tìm kiếm theo tên, email"]',
    userRowEditBtn: '//tbody/tr[td[contains(text(), "{username}")]]//button[@title="Chỉnh sửa"]',
    statusSelect: '//select[parent::div[label[contains(text(), "Trạng thái")]]]',
    submitBtn: 'button[type="submit"]',
  },

  // Actions
  navigateToUserList() {
    I.amOnPage('/admin/users');
    I.waitInUrl('/admin/users', 10);
  },

  async editUserStatus(username, status) {
    I.waitForElement(this.locators.searchBar, 10);
    I.clearField(this.locators.searchBar);
    I.fillField(this.locators.searchBar, username);
    I.pressKey('Enter');
    I.wait(1); // Chờ bộ lọc áp dụng

    const editBtnXPath = this.locators.userRowEditBtn.replace('{username}', username);
    I.waitForElement(editBtnXPath, 10);
    I.click(editBtnXPath);

    // Đang ở trang UserForm edit
    I.waitForElement(this.locators.statusSelect, 10);
    I.selectOption(this.locators.statusSelect, status); // 'active' hoặc 'inactive'
    I.click(this.locators.submitBtn);
    I.waitInUrl('/admin/users', 10);
  }
};
