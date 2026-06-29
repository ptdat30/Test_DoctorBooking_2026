// e2e/tests/public/public_pages_test.cjs
// Smoke test: Các trang public không cần đăng nhập

'use strict';

Feature('Trang công khai (Public Pages)');

Scenario('TC-PUB-01: Danh sách bác sĩ công khai load thành công', async ({ PublicPages }) => {
  PublicPages.navigateToDoctors();
  PublicPages.seeDoctorsLoaded();
}).tag('@public').tag('@smoke');

Scenario('TC-PUB-02: Trang chuyên khoa load thành công', async ({ PublicPages }) => {
  PublicPages.navigateToSpecialties();
  PublicPages.seeSpecialtiesLoaded();
}).tag('@public').tag('@smoke');

Scenario('TC-PUB-03: Trang giới thiệu load thành công', async ({ PublicPages }) => {
  PublicPages.navigateToAbout();
  PublicPages.seeAboutLoaded();
}).tag('@public').tag('@smoke');

Scenario('TC-PUB-04: Trang liên hệ load thành công', async ({ PublicPages }) => {
  PublicPages.navigateToContact();
  PublicPages.seeContactLoaded();
}).tag('@public').tag('@smoke');
