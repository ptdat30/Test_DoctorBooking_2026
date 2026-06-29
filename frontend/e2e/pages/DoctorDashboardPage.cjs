// e2e/pages/DoctorDashboardPage.cjs

'use strict';

const { I } = inject();

module.exports = {
  pageTitle: '//h1[contains(text(), "Doctor Dashboard")]',

  navigateTo() {
    I.amOnPage('/doctor/dashboard');
    I.waitInUrl('/doctor/dashboard', 10);
    I.waitForElement(this.pageTitle, 15);
  },

  seeDashboardLoaded() {
    I.seeElement(this.pageTitle);
    I.dontSee('404');
  },
};
