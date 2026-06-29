// e2e/pages/DoctorProfilePage.cjs

'use strict';

const { I } = inject();

module.exports = {
  editProfileBtn:    'button.edit-profile-btn',
  changePasswordBtn: 'button.btn-change-password',
  profileCard:       '.profile-section-card',

  navigateTo() {
    I.amOnPage('/doctor/profile');
    I.waitInUrl('/doctor/profile', 10);
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
