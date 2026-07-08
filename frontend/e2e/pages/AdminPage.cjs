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
    createUserBtn: '//button[contains(., "Thêm người dùng")]',
    createDoctorBtn: '//button[contains(., "Thêm bác sĩ")]',
    createPatientBtn: '//button[contains(., "Thêm Bệnh Nhân Mới")]',
  },

  // Actions
  navigateToDashboard() {
    I.amOnPage('/admin/dashboard');
    I.waitInUrl('/admin/dashboard', 10);
    I.waitForText('Tổng quan', 10);
  },

  navigateToDoctorList() {
    I.amOnPage('/admin/doctors');
    I.waitInUrl('/admin/doctors', 10);
    I.waitForText('Quản Lý Bác Sĩ', 10);
  },

  navigateToPatientList() {
    I.amOnPage('/admin/patients');
    I.waitInUrl('/admin/patients', 10);
    I.waitForText('Quản Lý Bệnh Nhân', 10);
  },

  navigateToAppointmentList() {
    I.amOnPage('/admin/appointments');
    I.waitInUrl('/admin/appointments', 10);
    I.waitForText('Quản Lý Lịch Hẹn', 10);
  },

  openCreateUserForm() {
    I.waitForElement(this.locators.createUserBtn, 10);
    I.click(this.locators.createUserBtn);
    I.waitInUrl('/admin/users/create', 10);
    I.waitForText('Tạo Người Dùng Mới', 10);
  },

  openCreateDoctorForm() {
    I.waitForElement(this.locators.createDoctorBtn, 10);
    I.click(this.locators.createDoctorBtn);
    I.waitInUrl('/admin/doctors/create', 10);
    I.waitForText('Tạo Bác Sĩ Mới', 10);
  },

  openCreatePatientForm() {
    I.waitForElement(this.locators.createPatientBtn, 10);
    I.click(this.locators.createPatientBtn);
    I.waitInUrl('/admin/patients/create', 10);
    I.waitForText('Tạo Bệnh Nhân Mới', 10);
  },
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
