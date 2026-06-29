// e2e/pages/PublicPages.cjs
// Page Object Model cho các trang public (không cần đăng nhập)

'use strict';

const { I } = inject();

module.exports = {
  navigateToDoctors() {
    I.amOnPage('/doctors');
    I.waitInUrl('/doctors', 10);
    I.waitForText('Danh sách Bác sĩ', 10);
  },

  navigateToSpecialties() {
    I.amOnPage('/specialties');
    I.waitInUrl('/specialties', 10);
    I.waitForText('Chuyên khoa', 10);
  },

  navigateToAbout() {
    I.amOnPage('/about');
    I.waitInUrl('/about', 10);
    I.waitForText('Về chúng tôi', 10);
  },

  navigateToContact() {
    I.amOnPage('/contact');
    I.waitInUrl('/contact', 10);
    I.waitForText('Liên hệ với chúng tôi', 10);
  },

  seeDoctorsLoaded() {
    I.seeElement('.doctors-grid');
    I.seeElement('.search-box input');
  },

  seeSpecialtiesLoaded() {
    I.seeElement('.specialties-grid');
    I.seeElement('.specialty-card');
  },

  seeAboutLoaded() {
    I.see('Sứ mệnh của chúng tôi');
    I.see('Giá trị cốt lõi');
  },

  seeContactLoaded() {
    I.seeElement('.contact-form');
    I.seeElement('#name');
    I.seeElement('#email');
  },
};
