# Chiến lược kiểm thử hộp đen (Blackbox Test Strategy) — Doctor Booking System 2026



> **Phạm vi:** Backend Spring Boot + Frontend React (CodeceptJS E2E)

> **Kỹ thuật chính:** Equivalence Partitioning (EP) + Boundary Value Analysis (BVA)

> **Tài liệu này là file tổng (Master/Index).** Mỗi chức năng có một file chi tiết riêng theo cùng một template.



---



## 1. Mục tiêu



1. Áp dụng **một quy trình thống nhất** (EP → BVA → Test case → Tự động hoá) cho toàn bộ chức năng có ràng buộc đầu vào.

2. Mỗi chức năng = **một file `.md`** chi tiết, dễ review, dễ bảo trì, dễ chấm điểm.

3. File tổng này giữ **chiến lược, phạm vi, quy ước tag, ma trận truy vết**.

4. **100% BVA** được bao phủ qua 3 tầng: JUnit DTO/Service, Postman/Newman, CodeceptJS `@bva`.



---



## 2. Mô hình tài liệu (vì sao tách file?)



| Tầng | File | Vai trò |

|---|---|---|

| Tổng (Master) | `README.md` (file này) | Chiến lược, phạm vi, quy ước, index, traceability |

| Chi tiết / chức năng | `EP_BVA_<Feature>.md` | EP + BVA + test case + mapping test |

| E2E Blackbox | `frontend/e2e/tests/blackbox/*_bva_test.cjs` | Kiểm thử biên qua UI (tag `@bva`) |



---



## 3. Tiêu chí chọn chức năng cần BVA



Một chức năng **cần file BVA riêng** nếu thoả ít nhất một điều kiện:



- Có miền số với `min`/`max` (`@Min`, `@Max`).

- Có ràng buộc độ dài chuỗi (`@Size`).

- Có biên thời gian / khoảng thời gian (ví dụ cửa sổ 24h).

- Có biên trạng thái theo ngưỡng số (ví dụ hạng thành viên theo điểm).



Chức năng **chỉ cần EP** (không BVA cổ điển): Notifications (rỗng/có dữ liệu).



---



## 4. Quy ước tag toàn dự án



| Feature | Prefix | EP hợp lệ | EP không hợp lệ | BVA |

|---|---|---|---|---|

| Register | `REG` | `REG-V*` | `REG-X*` | `REG-B*` |

| Login | `LOG` | `LOG-V*` | `LOG-X*` | `LOG-B*` |

| Feedback Rating | `FBR` | `FBR-V*` | `FBR-X*` | `FBR-B*` |

| Feedback Edit 24h | `FBT` | `FBT-V*` | `FBT-X*` | `FBT-B*` |

| Wallet Top-up | `WAL` | `WAL-V*` | `WAL-X*` | `WAL-B*` |

| Loyalty Tier | `LOY` | `LOY-V*` | `LOY-X*` | `LOY-B*` |

| Appointment Booking | `APT` | `APT-V*` | `APT-X*` | `APT-B*` |

| Health AI | `HAI` | `HAI-V*` | `HAI-X*` | `HAI-B*` |

| Notifications | `NOT` | `NOT-V*` | — | — |

| Profile Password | `PRF` | `PRF-V*` | `PRF-X*` | `PRF-B*` |



---



## 5. Index các chức năng kiểm thử hộp đen



| # | Chức năng | File chi tiết | Biên chính | Tự động hoá | Trạng thái |

|--:|---|---|---|---|---|

| 1 | Đăng ký | [`EP_BVA_Register.md`](./EP_BVA_Register.md) | username `[3,50]`, password `≥6` | JUnit + Postman + CodeceptJS | ✅ |

| 2 | Đăng nhập | [`EP_BVA_Login.md`](./EP_BVA_Login.md) | `@NotBlank` | JUnit + Postman + CodeceptJS | ✅ |

| 3 | Rating feedback | [`EP_BVA_Feedback_Rating.md`](./EP_BVA_Feedback_Rating.md) | rating `[1,5]` | JUnit + Postman + CodeceptJS | ✅ |

| 4 | Sửa feedback 24h | [`EP_BVA_Feedback_Edit24h.md`](./EP_BVA_Feedback_Edit24h.md) | mốc 24h | JUnit + CodeceptJS | ✅ |

| 5 | Nạp tiền ví | [`EP_BVA_Wallet_TopUp.md`](./EP_BVA_Wallet_TopUp.md) | amount `≥10,000` | JUnit + Postman + CodeceptJS | ✅ |

| 6 | Hạng thành viên | [`EP_BVA_LoyaltyTier.md`](./EP_BVA_LoyaltyTier.md) | 1000/5000/10000 | JUnit + CodeceptJS | ✅ |

| 7 | Đặt lịch khám | [`EP_BVA_Appointment_Booking.md`](./EP_BVA_Appointment_Booking.md) | 17 slot, past-time | JUnit + Postman + CodeceptJS | ✅ |

| 8 | Health AI | [`EP_BVA_Health_AI.md`](./EP_BVA_Health_AI.md) | symptoms `@NotBlank` | JUnit + CodeceptJS | ✅ |

| 9 | Thông báo | [`EP_BVA_Notifications.md`](./EP_BVA_Notifications.md) | rỗng / có unread | CodeceptJS | ✅ |

| 10 | Đổi mật khẩu | [`EP_BVA_Profile.md`](./EP_BVA_Profile.md) | password `≥6` | CodeceptJS | ✅ |



---



## 6. Ma trận truy vết tổng (Feature → Test tự động)



| Feature | JUnit (unit) | Postman/Newman | E2E CodeceptJS `@bva` |

|---|---|---|---|

| Register | `RegisterRequestValidationTest`, `AuthServiceTest` | `02_Auth` | `blackbox/register_bva_test.cjs` |

| Login | `LoginRequestValidationTest`, `AuthServiceTest` | `02_Auth` | `blackbox/login_bva_test.cjs` |

| Feedback Rating | `FeedbackRequestValidationTest`, `FeedbackServiceTest` | `07_Patient_Feedbacks` | `blackbox/feedback_rating_bva_test.cjs` |

| Feedback 24h | `FeedbackServiceTest` (BVA 24h) | — | `blackbox/feedback_edit_bva_test.cjs` |

| Wallet Top-up | `TopUpRequestValidationTest`, `WalletServiceTest` | `09_Patient_Wallet` | `blackbox/wallet_bva_test.cjs` |

| Loyalty Tier | `WalletServiceTest` (BVA tier) | — | `blackbox/loyalty_tier_bva_test.cjs` |

| Appointment Booking | `AppointmentServiceTest` | `05_Patient_Appointments` | `blackbox/booking_bva_test.cjs` |

| Health AI | `SymptomCheckRequestValidationTest` | — | `blackbox/health_ai_bva_test.cjs` |

| Notifications | — | — | `blackbox/notifications_bva_test.cjs` |

| Profile Password | — | — | `blackbox/profile_bva_test.cjs` |



---



## 7. Chạy E2E CodeceptJS

```bash
# Yêu cầu: backend :8080, frontend :5173 đang chạy
cd frontend

npm run e2e:smoke   # Mọi màn hình user tương tác (tag @smoke)
npm run e2e:bva     # Chỉ test biên (tag @bva)
npm run e2e         # Toàn bộ E2E
```

### Ma trận E2E smoke (100% luồng UI)

| Vai trò | File test | Màn hình |
|---|---|---|
| Public | `public/public_pages_test.cjs` | `/doctors`, `/specialties`, `/about`, `/contact` |
| Patient | `auth/*`, `patient/*`, `integration/*`, `blackbox/*` | dashboard, profile, booking, history, wallet, AI, … |
| Doctor | `doctor/doctor_smoke_test.cjs` + integration | dashboard, profile, patients, appointments, treatments, feedbacks |
| Admin | `admin/admin_smoke_test.cjs` + integration | dashboard, users, doctors, patients, appointments, feedbacks |



---



## 8. Quy ước trình bày trong mỗi file chi tiết



```

0. Đặc tả đầu vào (trích từ code)

Câu 1. Phân hoạch lớp tương đương (EP) + tag V/X

Câu 2. Phân tích giá trị biên (BVA) + tag B

Câu 3. Bảng test case + cột Tag được bao phủ

Câu 4. Triển khai kiểm thử tự động (JUnit/Postman/E2E)

Bảng truy vết tag → test

```



Expected luôn ghi: **Hợp lệ** (kèm HTTP) hoặc **Không hợp lệ (lý do)**.

