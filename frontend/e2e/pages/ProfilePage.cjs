// e2e/pages/ProfilePage.cjs
// Page Object Model cho trang Hồ sơ bệnh nhân (/patient/profile)

'use strict';

const { I } = inject();

module.exports = {
  // ── Locators ──────────────────────────────────────────────────────────────
  buttons: {
    editProfile:      '//button[contains(@class, "action-btn")][contains(., "Edit Profile")]',
    changePassword:   '//button[contains(@class, "action-btn")][contains(., "Change Password")]',
    sosEmergency:     '//button[contains(@class, "action-btn")][contains(., "SOS Emergency")]',
  },

  editModal: {
    fullName:         'input[name="fullName"]',
    dateOfBirth:      'input[name="dateOfBirth"]',
    gender:           'select[name="gender"]',
    phone:            'input[name="phone"]',
    address:          'input[name="address"]',
    saveBtn:          '//button[contains(@class, "btn-primary")][contains(., "Save Changes")]',
    cancelBtn:        '//button[contains(@class, "btn-secondary")][contains(., "Cancel")]',
  },

  passwordModal: {
    currentPassword:  '//div[label[contains(text(), "Current Password")]]/input',
    newPassword:      '//div[label[contains(text(), "New Password")]]/input',
    confirmPassword:  '//div[label[contains(text(), "Confirm New Password")]]/input',
    saveBtn:          '//button[contains(@class, "btn-primary")][contains(., "Update Password")]',
  },

  sosModal: {
    emergencyName:    '//div[label[contains(text(), "Emergency Contact Name")]]/input',
    emergencyPhone:   '//div[label[contains(text(), "Emergency Phone")]]/input',
    saveBtn:          '//button[contains(@class, "btn-danger")][contains(., "Save Emergency Contact")]',
  },

  alerts: {
    success:          '.alert-success',
    error:            '.alert-error',
  },

  // ── Actions ───────────────────────────────────────────────────────────────

  navigateTo() {
    I.amOnPage('/patient/profile');
    I.waitInUrl('/patient/profile', 10);
    I.waitForElement('.passport-card', 15);
  },

  openEditProfile() {
    I.waitForVisible(this.buttons.editProfile, 10);
    I.click(this.buttons.editProfile);
    I.waitForVisible(this.editModal.fullName, 10);
  },

  updateProfile(data) {
    if (data.fullName !== undefined) {
      I.clearField(this.editModal.fullName);
      I.fillField(this.editModal.fullName, data.fullName);
    }
    if (data.dateOfBirth !== undefined) {
      // Set date of birth via JavaScript to avoid browser date picker issues
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
    I.click(this.editModal.saveBtn);
    I.waitForInvisible(this.editModal.saveBtn, 10);
  },

  openChangePassword() {
    I.waitForVisible(this.buttons.changePassword, 10);
    I.click(this.buttons.changePassword);
    I.waitForVisible(this.passwordModal.currentPassword, 10);
  },

  changePassword(oldPass, newPass, confirmPass = newPass) {
    I.fillField(this.passwordModal.currentPassword, oldPass);
    I.fillField(this.passwordModal.newPassword, newPass);
    I.fillField(this.passwordModal.confirmPassword, confirmPass);
    I.click(this.passwordModal.saveBtn);
  },

  openSOS() {
    I.waitForVisible(this.buttons.sosEmergency, 10);
    I.click(this.buttons.sosEmergency);
    I.waitForVisible(this.sosModal.emergencyName, 10);
  },

  updateSOS(name, phone) {
    I.clearField(this.sosModal.emergencyName);
    I.fillField(this.sosModal.emergencyName, name);
    I.clearField(this.sosModal.emergencyPhone);
    I.fillField(this.sosModal.emergencyPhone, phone);
    I.click(this.sosModal.saveBtn);
    I.waitForInvisible(this.sosModal.saveBtn, 10);
  },

  seeSuccessMessage(text) {
    I.waitForElement(this.alerts.success, 10);
    I.see(text, this.alerts.success);
  },

  seeErrorMessage(text) {
    I.waitForElement(this.alerts.error, 10);
    I.see(text, this.alerts.error);
  }
};
