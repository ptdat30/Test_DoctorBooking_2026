// e2e/data/factory.js
// Data Factory – Sinh dữ liệu test ngẫu nhiên bằng @faker-js/faker
// Mỗi lần chạy test = một bộ dữ liệu khác nhau → tránh conflict data cũ

'use strict';

const { faker } = require('@faker-js/faker');

/**
 * Cấu hình locale Tiếng Anh để tránh ký tự đặc biệt gây lỗi trên UI
 * Có thể đổi thành 'vi' nếu backend hỗ trợ
 */
faker.locale = 'en';

const factory = {
  /**
   * Tạo dữ liệu User ngẫu nhiên cho test đăng ký
   * Username unique nhờ uuid suffix → an toàn khi chạy parallel
   *
   * @returns {{ fullName, username, email, password, phone }}
   */
  createUser() {
    const suffix   = faker.string.alphanumeric(6).toLowerCase();
    const firstName = faker.person.firstName();
    const lastName  = faker.person.lastName();

    return {
      fullName: `${firstName} ${lastName}`,
      username: `test_${suffix}`,                          // VD: test_a3b9c1
      email:    `test_${suffix}@yopmail.com`,              // Dùng yopmail để tránh spam
      password: 'Test@123456',                             // Password đủ mạnh cho validation
      phone:    '09' + faker.string.numeric(8),            // Format SĐT Việt Nam
    };
  },

  /**
   * Tạo dữ liệu Doctor ngẫu nhiên (dùng khi cần seed bác sĩ test)
   *
   * @returns {{ fullName, specialization, experience, bio }}
   */
  createDoctorProfile() {
    const specializations = [
      'Cardiology', 'Neurology', 'Pediatrics',
      'Orthopedics', 'Dermatology', 'General Practice',
    ];

    return {
      fullName:       `Dr. ${faker.person.firstName()} ${faker.person.lastName()}`,
      specialization: faker.helpers.arrayElement(specializations),
      experience:     faker.number.int({ min: 2, max: 30 }),
      bio:            faker.lorem.sentences(2),
    };
  },

  /**
   * Tạo ghi chú đặt lịch ngẫu nhiên
   *
   * @returns {string}
   */
  createAppointmentNote() {
    const symptoms = [
      'Headache and dizziness',
      'Chest pain and shortness of breath',
      'Fever and cough for 3 days',
      'Back pain after exercise',
      'Skin rash on left arm',
    ];
    return faker.helpers.arrayElement(symptoms);
  },

  /**
   * Tạo search query ngẫu nhiên cho test tìm kiếm
   *
   * @returns {string}
   */
  createSearchQuery() {
    return faker.person.lastName(); // Tìm theo họ bác sĩ
  },

  /**
   * Chuỗi có độ dài cố định (dùng cho BVA username/password)
   * @param {number} length
   * @param {string} [char='a']
   * @returns {string}
   */
  stringOfLength(length, char = 'a') {
    return char.repeat(length);
  },
};

module.exports = factory;
