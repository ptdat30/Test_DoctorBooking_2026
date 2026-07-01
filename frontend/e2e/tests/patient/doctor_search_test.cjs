// e2e/tests/patient/doctor_search_test.js
// Test: Tìm kiếm bác sĩ – Search, Filter, Empty state

'use strict';

const factory = require('../../data/factory.cjs');
const { searchTermForDoctors } = require('../../helpers/doctorResolver.cjs');

Feature('Tìm kiếm Bác sĩ (Doctor Search)');

let testPatient;

Before(async ({ I, LoginPage }) => {
  testPatient = factory.createUser();
  await I.createTestUser(testPatient);
  // Login trước khi test (trang search yêu cầu auth)
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');
});

After(async ({ I }) => {
  if (testPatient?.username) {
    await I.deleteTestUser(testPatient.username);
  }
});

// ─────────────────────────────────────────────────────────────────────────

/**
 * TC-SEARCH-01: Trang tìm kiếm load thành công sau khi login
 */
Scenario('TC-SEARCH-01: Trang tìm kiếm bác sĩ load đúng sau khi login', async ({ I, DoctorSearchPage }) => {
  await DoctorSearchPage.navigateTo();
  I.seeInCurrentUrl('/patient/doctors');
  I.seeElement(DoctorSearchPage.search.input);
}).tag('@smoke').tag('@search').tag('@patient');

/**
 * TC-SEARCH-02: Tìm kiếm theo tên → hiển thị kết quả
 */
Scenario('TC-SEARCH-02: Tìm kiếm bác sĩ → hiển thị danh sách kết quả', async ({ I, DoctorSearchPage }) => {
  // Arrange: lấy danh sách bác sĩ thật từ API để biết tên tìm
  const doctors = await I.getDoctors();
  const searchName = doctors.length > 0
    ? searchTermForDoctors(doctors)
    : 'One';

  await DoctorSearchPage.navigateTo();

  // Act
  DoctorSearchPage.searchDoctor(searchName);

  // Assert
  DoctorSearchPage.seeSearchResults();
}).tag('@search').tag('@patient');

/**
 * TC-SEARCH-03: Tìm kiếm chuỗi không khớp → hiển thị empty state
 */
Scenario('TC-SEARCH-03: Tìm không có kết quả → hiển thị empty state', async ({ I, DoctorSearchPage }) => {
  await DoctorSearchPage.navigateTo();

  // Dùng chuỗi ký tự lạ không thể là tên bác sĩ
  DoctorSearchPage.searchDoctor('xyzxyzxyz_no_match_999');

  // Assert: empty state phải hiển thị
  DoctorSearchPage.seeEmptyState();
}).tag('@search').tag('@patient').tag('@negative');

/**
 * TC-SEARCH-04: Thanh tìm kiếm chấp nhận input tiếng Việt
 */
Scenario('TC-SEARCH-04: Search với ký tự tiếng Việt hoạt động bình thường', async ({ I, DoctorSearchPage }) => {
  await DoctorSearchPage.navigateTo();

  // Act: nhập tiếng Việt
  I.fillField(DoctorSearchPage.search.input, 'Nguyễn');
  I.pressKey('Enter');
  I.waitForInvisible(DoctorSearchPage.results.loadingState, 10);

  // Assert: app không bị crash (dù có hay không có kết quả)
  I.dontSee('Error');
  I.dontSee('500');
}).tag('@search').tag('@patient');

