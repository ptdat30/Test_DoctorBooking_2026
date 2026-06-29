// e2e/tests/patient/profile_test.cjs
// Test: Quản lý hồ sơ cá nhân và đổi mật khẩu

'use strict';

const factory = require('../../data/factory.cjs');

Feature('Hồ sơ bệnh nhân (Profile)');

let testPatient;

Before(async ({ I, LoginPage }) => {
  testPatient = factory.createUser();
  await I.createTestUser(testPatient);
});

After(async ({ I }) => {
  if (testPatient?.username) {
    await I.deleteTestUser(testPatient.username);
  }
});

Scenario('TC-PROFILE-01: Cập nhật thông tin cá nhân thành công', async ({ I, LoginPage, ProfilePage }) => {
  // Act: Đăng nhập và vào trang Profile
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  ProfilePage.navigateTo();

  // Mở modal Edit và cập nhật thông tin
  ProfilePage.openEditProfile();
  
  const updatedData = {
    fullName: testPatient.fullName + ' Edited',
    dateOfBirth: '1992-08-24',
    gender: 'MALE',
    phone: '0912345678',
    address: '456 Test Road, HCM City'
  };

  ProfilePage.updateProfile(updatedData);

  // Assert: Thấy thông báo thành công và thông tin mới cập nhật hiển thị
  ProfilePage.seeSuccessMessage('Profile updated successfully');
  I.see(updatedData.fullName, '.patient-name');
  I.see('Age:', '.medical-passport');
}).tag('@profile').tag('@patient');

Scenario('TC-PROFILE-02: Đổi mật khẩu thành công và kiểm tra đăng nhập bằng mật khẩu mới', async ({ I, LoginPage, ProfilePage, AuthSteps }) => {
  // Act: Đăng nhập và vào trang Profile
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  ProfilePage.navigateTo();

  // Đổi mật khẩu
  ProfilePage.openChangePassword();
  const newPassword = 'NewSecurePassword@123';
  ProfilePage.changePassword(testPatient.password, newPassword);

  // Assert: Đổi thành công
  ProfilePage.seeSuccessMessage('Password changed successfully');

  // Đăng xuất
  AuthSteps.logout();

  // Thử đăng nhập lại bằng mật khẩu cũ -> Thất bại
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeError('Invalid username or password');

  // Đăng nhập lại bằng mật khẩu mới -> Thành công
  await LoginPage.login(testPatient.username, newPassword);
  LoginPage.seeSuccessRedirect('patient');
}).tag('@profile').tag('@patient');

Scenario('TC-PROFILE-03: Đổi mật khẩu thất bại do mật khẩu xác nhận không khớp', async ({ I, LoginPage, ProfilePage }) => {
  // Act: Đăng nhập và vào trang Profile
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  ProfilePage.navigateTo();

  // Đổi mật khẩu không khớp
  ProfilePage.openChangePassword();
  ProfilePage.changePassword(testPatient.password, 'NewPassword@123', 'MismatchPassword@999');

  // Assert: Thấy thông báo lỗi
  ProfilePage.seeErrorMessage('New passwords do not match');
}).tag('@profile').tag('@patient').tag('@negative');

Scenario('TC-PROFILE-04: Cập nhật liên hệ khẩn cấp SOS thành công', async ({ LoginPage, ProfilePage }) => {
  await LoginPage.login(testPatient.username, testPatient.password);
  LoginPage.seeSuccessRedirect('patient');

  ProfilePage.navigateTo();

  // Hoàn thiện hồ sơ trước (handleUpdateSOS gửi kèm toàn bộ formData → cần các field bắt buộc hợp lệ)
  ProfilePage.openEditProfile();
  ProfilePage.updateProfile({
    fullName: testPatient.fullName,
    dateOfBirth: '1992-08-24',
    gender: 'MALE',
    phone: '0912345678',
    address: '456 Test Road, HCM City',
  });

  // Cập nhật liên hệ khẩn cấp SOS rồi xác minh đã lưu (mở lại modal kiểm tra giá trị)
  ProfilePage.openSOS();
  ProfilePage.updateSOS('Nguyen Van A', '0987654321');
  ProfilePage.verifySOSPersisted('Nguyen Van A', '0987654321');
}).tag('@profile').tag('@patient').tag('@smoke');
