// e2e/pages/DoctorPatientSearchPage.cjs

'use strict';

const { I } = inject();

module.exports = {
  pageTitle:    '//h1[contains(text(), "Tìm bệnh nhân")]',
  searchInput:  'input[placeholder="Tìm kiếm theo tên, ID, email..."]',
  patientTable: 'table',

  navigateTo() {
    I.amOnPage('/doctor/patients');
    I.waitInUrl('/doctor/patients', 10);
    I.waitForElement(this.pageTitle, 15);
  },

  search(keyword) {
    I.waitForElement(this.searchInput, 10);
    I.fillField(this.searchInput, keyword);
    I.wait(1);
  },

  seePageLoaded() {
    I.seeElement(this.patientTable);
  },
};
