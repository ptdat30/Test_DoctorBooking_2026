// e2e/helpers/ApiHelper.js
// Custom Helper – Gọi trực tiếp API backend để setup/teardown test data
// Dùng khi cần tạo user, cleanup sau test – KHÔNG dùng I.* (đây là helper layer)

'use strict';

const Helper = require('@codeceptjs/helper');
const axios  = require('axios').default;

/**
 * ApiHelper – Tương tác với backend REST API để quản lý test data
 * Gọi từ test: I.createTestUser(data), I.deleteTestUser(username), v.v.
 *
 * Đảm bảo State Isolation khi chạy parallel workers (mỗi test có user riêng)
 */
class ApiHelper extends Helper {
  constructor(config) {
    super(config);
    this.apiBaseUrl = config.apiBaseUrl || 'http://localhost:8080/api';
    // Lưu token admin để gọi API cần auth
    this._adminToken = null;
  }

  /**
   * Lấy admin token (lazy load – chỉ gọi API một lần)
   * @private
   */
  async _getAdminToken() {
    if (this._adminToken) return this._adminToken;

    const resp = await axios.post(`${this.apiBaseUrl}/auth/login`, {
      username: process.env.TEST_ADMIN_USERNAME || 'admin',
      password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
    });

    // Cấu trúc response dựa trên AuthController của project
    this._adminToken = resp.data?.token || resp.data?.accessToken;
    return this._adminToken;
  }

  /**
   * Tạo một user test mới qua API /auth/register
   * Dùng trong Before() của mỗi test để đảm bảo State Isolation
   *
   * @param {{ username: string, password: string, email: string, fullName: string, phone?: string }} userData
   * @returns {Promise<{ username: string, password: string, userId: number }>}
   */
  async createTestUser(userData) {
    try {
      const resp = await axios.post(`${this.apiBaseUrl}/auth/register`, {
        username: userData.username,
        password: userData.password,
        email:    userData.email,
        fullName: userData.fullName,
        phone:    userData.phone || '',
      });

      console.log(`[Data Seeding] ✅ Created test user: ${userData.username}`);
      return {
        ...userData,
        userId: resp.data?.id || resp.data?.userId,
      };
    } catch (err) {
      console.error(`[Data Seeding] ⚠️ createTestUser error:`, err.response?.data || err.message);
      // Nếu user đã tồn tại (conflict), vẫn trả về data để test tiếp
      return userData;
    }
  }

  /**
   * Xóa user test sau khi test xong (cleanup)
   * Gọi endpoint admin DELETE /admin/users/{id}
   *
   * @param {string} username
   */
  async deleteTestUser(username) {
    try {
      const token = await this._getAdminToken();
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // 1. Search for user by username to get ID
      const searchRes = await axios.get(`${this.apiBaseUrl}/admin/users?search=${username}`, config);
      const users = searchRes.data || [];
      const targetUser = users.find(u => u.username === username);

      if (!targetUser) {
        console.log(`[Data Cleanup] User ${username} not found in DB. Skipping deletion.`);
        return;
      }

      // 2. Delete user by ID
      await axios.delete(`${this.apiBaseUrl}/admin/users/${targetUser.id}`, config);
      console.log(`[Data Cleanup] 🗑️ Deleted test user: ${username} (ID: ${targetUser.id})`);
    } catch (err) {
      // Không fail test nếu cleanup lỗi, chỉ log warning
      console.error(`[Data Cleanup] ⚠️ deleteTestUser warning:`, err.response?.data || err.message);
    }
  }

  /**
   * Lấy danh sách bác sĩ từ API (để seed data cho booking test)
   * @returns {Promise<Array>}
   */
  async getDoctors() {
    try {
      const token = await this._getAdminToken();
      const resp = await axios.get(`${this.apiBaseUrl}/admin/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return resp.data || [];
    } catch (err) {
      console.error(`[Data Seeding] ⚠️ getDoctors error:`, err.response?.data || err.message);
      return [];
    }
  }

  /**
   * Reset admin token (gọi nếu token expired)
   */
  resetAdminToken() {
    this._adminToken = null;
  }
}

module.exports = ApiHelper;
