// e2e/pages/DoctorProfilePage.cjs

'use strict';

const { I } = inject();

module.exports = {
  editProfileBtn:    '//button[contains(., "Chỉnh sửa")]',
  changePasswordBtn: '//button[contains(., "Đổi mật khẩu")]',
  profileCard:       '.app-card',

  navigateTo() {
    I.amOnPage('/doctor/profile');
    I.waitInUrl('/doctor/profile', 10);
    I.waitForText('Hồ sơ của tôi', 15);
    I.waitForElement(this.profileCard, 15);
  },

  seeProfileLoaded() {
    I.seeElement(this.editProfileBtn);
    I.seeElement(this.changePasswordBtn);
  },

  openEditProfile() {
    I.click(this.editProfileBtn);
    I.waitForElement('input[name="fullName"]', 10);
  },
};
