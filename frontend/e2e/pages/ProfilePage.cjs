// e2e/pages/ProfilePage.cjs
// Page Object Model cho trang Hồ sơ bệnh nhân (/patient/profile)

'use strict';

const { I } = inject();

module.exports = {
  // ── Locators ──────────────────────────────────────────────────────────────
  buttons: {
    editProfile:      '//button[contains(., "Chỉnh sửa hồ sơ")]',
    changePassword:   '//button[contains(., "Đổi mật khẩu")]',
    sosEmergency:     '//button[contains(., "Liên hệ khẩn cấp")]',
  },

  editModal: {
    fullName:         'input[name="fullName"]',
    dateOfBirth:      'input[name="dateOfBirth"]',
    gender:           'select[name="gender"]',
    phone:            'input[name="phone"]',
    address:          'input[name="address"]',
    saveBtn:          '//button[contains(., "Lưu thay đổi")]',
    cancelBtn:        '//button[contains(., "Hủy")]',
  },

  passwordModal: {
    currentPassword:  '(//form[@id="password-form"]//input[@type="password"])[1]',
    newPassword:      '(//form[@id="password-form"]//input[@type="password"])[2]',
    confirmPassword:  '(//form[@id="password-form"]//input[@type="password"])[3]',
    saveBtn:          '//button[contains(., "Cập nhật")]',
  },

  sosModal: {
    emergencyName:    '//form[@id="sos-form"]//label[contains(., "Tên người liên hệ")]/following-sibling::input',
    emergencyPhone:   '//form[@id="sos-form"]//label[contains(., "Số điện thoại khẩn cấp")]/following-sibling::input',
    saveBtn:          '//form[@id="sos-form"]/ancestor::div[contains(@class, "app-card")]//button[contains(., "Lưu")]',
  },

  alerts: {
    success:          '.border-emerald-200',
    error:            '.border-rose-200',
  },

  // ── Actions ───────────────────────────────────────────────────────────────

  navigateTo() {
    I.amOnPage('/patient/profile');
    I.waitInUrl('/patient/profile', 10);
    I.waitForText('Hồ sơ cá nhân', 15);
  },

  openEditProfile() {
    I.waitForVisible(this.buttons.editProfile, 10);
    I.forceClick(this.buttons.editProfile);
    I.waitForVisible(this.editModal.fullName, 10);
  },

  updateProfile(data) {
    if (data.fullName !== undefined) {
      I.clearField(this.editModal.fullName);
      I.fillField(this.editModal.fullName, data.fullName);
    }
    if (data.dateOfBirth !== undefined) {
      I.executeScript((dateVal) => {
        const input = document.querySelector('input[name="dateOfBirth"]');
        if (input) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, dateVal);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, data.dateOfBirth);
    }
    if (data.gender !== undefined) {
      I.selectOption(this.editModal.gender, data.gender);
    }
    if (data.phone !== undefined) {
      I.clearField(this.editModal.phone);
      I.fillField(this.editModal.phone, data.phone);
    }
    if (data.address !== undefined) {
      I.clearField(this.editModal.address);
      I.fillField(this.editModal.address, data.address);
    }
    I.forceClick(this.editModal.saveBtn);
    I.waitForInvisible(this.editModal.fullName, 10);
  },

  openChangePassword() {
    I.waitForVisible(this.buttons.changePassword, 10);
    I.forceClick(this.buttons.changePassword);
    I.waitForVisible(this.passwordModal.currentPassword, 10);
  },

  changePassword(oldPass, newPass, confirmPass = newPass) {
    I.fillField(this.passwordModal.currentPassword, oldPass);
    I.fillField(this.passwordModal.newPassword, newPass);
    I.fillField(this.passwordModal.confirmPassword, confirmPass);
    I.forceClick(this.passwordModal.saveBtn);
  },

  openSOS() {
    I.waitForVisible(this.buttons.sosEmergency, 10);
    I.forceClick(this.buttons.sosEmergency);
    I.waitForVisible(this.sosModal.emergencyName, 10);
  },

  updateSOS(name, phone) {
    I.clearField(this.sosModal.emergencyName);
    I.fillField(this.sosModal.emergencyName, name);
    I.clearField(this.sosModal.emergencyPhone);
    I.fillField(this.sosModal.emergencyPhone, phone);
    I.forceClick(this.sosModal.saveBtn);
    I.waitForInvisible(this.sosModal.emergencyName, 10);
  },

  verifySOSPersisted(name, phone) {
    I.dontSeeElement(this.alerts.error);
    this.openSOS();
    I.seeInField(this.sosModal.emergencyName, name);
    I.seeInField(this.sosModal.emergencyPhone, phone);
  },

  seeSuccessMessage(text) {
    I.waitForText(text, 10);
  },

  seeErrorMessage(text) {
    I.waitForText(text, 10);
  },

  async seeNewPasswordTooShort() {
    const tooShort = await I.executeScript(() => {
      const inputs = Array.from(document.querySelectorAll('#password-form input[type="password"]'));
      const newPass = inputs[1];
      return newPass ? (newPass.validity.valid === false && newPass.validity.tooShort) : false;
    });
    if (!tooShort) {
      throw new Error('Expected New Password to be blocked by HTML5 minLength (tooShort)');
    }
    I.seeElement(this.passwordModal.saveBtn);
  }
};
