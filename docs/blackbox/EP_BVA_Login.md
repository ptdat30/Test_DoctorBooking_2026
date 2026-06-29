# Kiểm thử hộp đen chức năng Đăng nhập (Login)

> **Dự án:** Doctor Booking System 2026
> **Kỹ thuật:** Equivalence Partitioning (EP) là chính + BVA phụ (rỗng/không rỗng)
> **Đối tượng kiểm thử:** `POST /api/auth/login` → `LoginRequest` + `AuthService.login()`
> **Prefix tag:** `LOG`

---

## 0. Đặc tả đầu vào (lấy trực tiếp từ code)

`backend/.../dto/request/LoginRequest.java`:

| Biến đầu vào | Ý nghĩa | Kiểu | Ràng buộc DTO | Miền hợp lệ |
|---|---|---|---|---|
| `username` | Tên đăng nhập | String | `@NotBlank` | chuỗi không rỗng |
| `password` | Mật khẩu | String | `@NotBlank` | chuỗi không rỗng |

Quy tắc nghiệp vụ (`AuthService.login()` + `AuthController`):
- Sai username/password → `AuthenticationException` → HTTP **401** (`Invalid username or password`).
- Thiếu field (`@NotBlank`) → HTTP **400**.

> Login **không có biên số/độ dài** (khác Register: login không kiểm tra min/max). Vì vậy đây là chức năng **thiên về EP + negative test**, BVA chỉ ở mức ranh giới rỗng/không rỗng. Đưa vào bộ tài liệu để **đầy đủ**, nhưng không phải ứng viên BVA số học.

---

## Câu 1. Phân hoạch lớp tương đương (EP)

| Biến | Lớp hợp lệ | Tag | Lớp không hợp lệ | Tag |
|---|---|---|---|---|
| `username` | chuỗi không rỗng | **LOG-V1** | rỗng / chỉ khoảng trắng (`@NotBlank`) | **LOG-X1** |
| `password` | chuỗi không rỗng | **LOG-V2** | rỗng / chỉ khoảng trắng (`@NotBlank`) | **LOG-X2** |
| cặp credential (rule) | đúng username + đúng password | **LOG-V3** | sai password | **LOG-X3** |
| | | | username không tồn tại | **LOG-X4** |

---

## Câu 2. Phân tích giá trị biên (BVA) — ranh giới rỗng/không rỗng

`@NotBlank` tạo ra một biên duy nhất: chuỗi rỗng/khoảng trắng (không hợp lệ) ↔ có ít nhất 1 ký tự nhìn thấy (hợp lệ).

| Ký hiệu | Giá trị | Kết quả mong đợi | Tag |
|---|---|---|---|
| rỗng | `""` | Không hợp lệ | **LOG-B0** |
| chỉ khoảng trắng | `"   "` | Không hợp lệ (`@NotBlank` coi là blank) | **LOG-B1** |
| tối thiểu không rỗng | `"a"` (1 ký tự) | Hợp lệ về định dạng (qua validation) | **LOG-B2** |

---

## Câu 3. Thiết kế test case

| STT | Tên test case | username | password | Kết quả mong đợi | Tag được bao phủ |
|--:|---|---|---|---|---|
| 1 | TC_LOG_VAL_SUCCESS | đúng | đúng | Hợp lệ (200 + token) | LOG-V1, LOG-V2, LOG-V3 |
| 2 | TC_LOG_INV_WRONGPASS | đúng | sai | Không hợp lệ (401 sai mật khẩu) | LOG-X3 |
| 3 | TC_LOG_INV_NOUSER | không tồn tại | bất kỳ | Không hợp lệ (401) | LOG-X4 |
| 4 | TC_LOG_INV_BLANK_USER | "" | đúng | Không hợp lệ (400 username blank) | LOG-X1, LOG-B0 |
| 5 | TC_LOG_INV_WS_USER | "   " | đúng | Không hợp lệ (400 username blank) | LOG-X1, LOG-B1 |
| 6 | TC_LOG_INV_BLANK_PASS | đúng | "" | Không hợp lệ (400 password blank) | LOG-X2, LOG-B0 |
| 7 | TC_LOG_VAL_MINNONBLANK | "a" | "a" | Qua validation (sau đó 401 do sai credential) | LOG-V1, LOG-B2 |
| 8 | TC_LOG_INV_BOTH_BLANK | "" | "" | Không hợp lệ (400) | LOG-X1, LOG-X2 |

8 TC = mức tối thiểu; có valid + invalid + biên rỗng/không rỗng.

---

## Câu 4. Triển khai kiểm thử tự động

### 4.1. Tầng validation DTO — JUnit 5 + Jakarta Validator
File **mới**: `backend/src/test/java/com/doctorbooking/backend/dto/LoginRequestValidationTest.java`
Test `@NotBlank` cho username/password tại `""`, `"   "`, `"a"` → LOG-B0, LOG-B1, LOG-B2, LOG-X1, LOG-X2.

### 4.2. Tầng nghiệp vụ — JUnit 5 + Mockito
File có sẵn: `AuthServiceTest.java` (`login_success`, `login_fails_badCredentials`) → LOG-V3, LOG-X3, LOG-X4.

### 4.3. Tầng API — Postman/Newman
`02_Auth`: Login Missing Password (400), Wrong Credentials (401), SQL Injection Username (không 500).

### 4.4. Tầng UI E2E — CodeceptJS (Blackbox BVA)

File: `frontend/e2e/tests/blackbox/login_bva_test.cjs` (tag `@bva`)

| Scenario | Tag | Mô tả |
|---|---|---|
| Username rỗng | LOG-B0 | HTML5 required |
| Username khoảng trắng | LOG-B1 | Vẫn ở /login |
| Password rỗng | LOG-X2 | HTML5 required |
| Sai mật khẩu | LOG-X3 | Error 401 message |

Chạy: `cd frontend && npx codeceptjs run --grep @bva --grep login`

---

## Bảng truy vết tag → test

| Tag | Mô tả | Test tự động |
|---|---|---|
| LOG-V1, LOG-V2, LOG-B2 | field không rỗng hợp lệ | `LoginRequestValidationTest` (valid cases) |
| LOG-X1, LOG-B0, LOG-B1 | username rỗng/khoảng trắng | `LoginRequestValidationTest#username_blank_invalid` |
| LOG-X2 | password rỗng | `LoginRequestValidationTest#password_blank_invalid` |
| LOG-V3 | đăng nhập thành công | `AuthServiceTest#login_success` |
| LOG-X3 | sai mật khẩu | `AuthServiceTest#login_fails_badCredentials` |
| LOG-X4 | username không tồn tại | Postman `POST Login – Wrong Credentials` |

---

## Ghi chú

Login minh hoạ rằng **không phải chức năng nào cũng cần BVA số học**. Ở đây EP + negative test (401/400) là trọng tâm; BVA chỉ giới hạn ở ranh giới `@NotBlank`. Tài liệu vẫn được lập để bộ hồ sơ kiểm thử **đầy đủ và nhất quán**.
