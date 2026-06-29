# E2E Test Matrix (CodeceptJS + Playwright)

> Source: `frontend/e2e/tests/` — chạy khi backend `:8080` và frontend `:5173` đang hoạt động.

## Lệnh chạy

```bash
cd frontend
npm run e2e:smoke   # Tag @smoke — luồng UI chính
npm run e2e:bva     # Tag @bva  — blackbox boundary
npm run e2e         # Toàn bộ E2E
```

## Blackbox BVA (`@bva`)

| # | Feature | File test | Ticket |
|---|---------|-----------|--------|
| 1 | Register | `blackbox/register_bva_test.cjs` | SCRUM-195 |
| 2 | Login | `blackbox/login_bva_test.cjs` | SCRUM-196 |
| 3 | Appointment Booking | `blackbox/booking_bva_test.cjs` | SCRUM-197 |
| 4 | Feedback Rating | `blackbox/feedback_rating_bva_test.cjs` | SCRUM-198 |
| 5 | Feedback Edit 24h | `blackbox/feedback_edit_bva_test.cjs` | SCRUM-199 |
| 6 | Wallet Top-up | `blackbox/wallet_bva_test.cjs` | SCRUM-200 |
| 7 | Loyalty Tier | `blackbox/loyalty_tier_bva_test.cjs` | SCRUM-201 |
| 8 | Health AI | `blackbox/health_ai_bva_test.cjs` | SCRUM-202 |
| 9 | Notifications | `blackbox/notifications_bva_test.cjs` | SCRUM-203 |
| 10 | Profile Password | `blackbox/profile_bva_test.cjs` | SCRUM-204 |

## Smoke tests (`@smoke`)

| Vai trò | File test | Ticket | Màn hình / luồng |
|---------|-----------|--------|------------------|
| **Public** | `public/public_pages_test.cjs` | SCRUM-208 | `/doctors`, `/specialties`, `/about`, `/contact` |
| **Patient** | `auth/login_test.cjs`, `auth/register_test.cjs` | SCRUM-205 | Đăng nhập, đăng ký |
| **Patient** | `patient/dashboard_test.cjs` | SCRUM-205 | Dashboard bệnh nhân |
| **Patient** | `patient/profile_test.cjs` | SCRUM-205 | Hồ sơ, đổi mật khẩu |
| **Patient** | `patient/booking_test.cjs` | SCRUM-205 | Đặt lịch khám |
| **Patient** | `patient/wallet_test.cjs` | SCRUM-205 | Ví, nạp tiền |
| **Patient** | `patient/health_ai_test.cjs` | SCRUM-205 | AI triệu chứng |
| **Patient** | `patient/doctor_search_test.cjs` | SCRUM-205 | Tìm bác sĩ |
| **Patient** | `patient/history_test.cjs` | SCRUM-205 | Lịch sử khám |
| **Patient** | `patient/appointment_payment_test.cjs` | SCRUM-205 | Thanh toán lịch hẹn |
| **Doctor** | `doctor/doctor_smoke_test.cjs` | SCRUM-206 | Dashboard, lịch hẹn, bệnh nhân |
| **Admin** | `admin/admin_smoke_test.cjs` | SCRUM-207 | Quản lý users, doctors, appointments |

## Integration flows

| File | Mô tả |
|------|-------|
| `integration/family_booking_test.cjs` | Đặt lịch cho người nhà |
| `integration/feedback_test.cjs` | Luồng feedback end-to-end |
| `integration/admin_flow_test.cjs` | Luồng admin |
| `integration/multi_role_test.cjs` | Đa vai trò |

## Liên kết tài liệu BVA

Chi tiết EP/BVA từng feature: [`../02_Blackbox/README.md`](../02_Blackbox/README.md)
