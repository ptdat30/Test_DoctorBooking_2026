# Kiểm thử hộp đen chức năng Đăng ký tài khoản (Register)

> **Dự án:** Doctor Booking System 2026
> **Kỹ thuật:** Equivalence Partitioning (EP) + Boundary Value Analysis (BVA)
> **Đối tượng kiểm thử:** `POST /api/auth/register` → `RegisterRequest` (Jakarta Validation) + `AuthService.register()`
> **Tài liệu này bám theo mẫu blackbox:** Câu 1 (EP) → Câu 2 (BVA) → Câu 3 (Test case) → Câu 4 (Tự động hoá)

---

## 0. Đặc tả đầu vào (lấy trực tiếp từ code)

Ràng buộc thực tế trong `backend/.../dto/request/RegisterRequest.java`:

| Biến đầu vào | Ý nghĩa | Kiểu | Ràng buộc trong code | Miền hợp lệ |
|---|---|---|---|---|
| `username` | Tên đăng nhập | String | `@NotBlank` + `@Size(min=3, max=50)` | độ dài `3 ≤ len ≤ 50` |
| `password` | Mật khẩu | String | `@NotBlank` + `@Size(min=6)` | độ dài `len ≥ 6` (không có max) |
| `email` | Email | String | `@NotBlank` + `@Email` | đúng định dạng email |
| `fullName` | Họ tên | String | `@NotBlank` | chuỗi không rỗng |
| `phone` | Số điện thoại | String | *(không ràng buộc)* | bất kỳ / null |
| `role` | Vai trò | String | *(không ràng buộc)* | `PATIENT`/`DOCTOR`/`ADMIN`; sai/null → mặc định `PATIENT` |

Quy tắc nghiệp vụ bổ sung (trong `AuthService.register()`):
- `username` đã tồn tại → ném `RuntimeException("Username already exists")` → HTTP **400**.
- `email` đã tồn tại → ném `RuntimeException("Email already exists")` → HTTP **400**.

Công thức hợp lệ (chỉ xét tầng validation đầu vào):

```
Valid = (3 ≤ len(username) ≤ 50)
      ∧ (len(password) ≥ 6)
      ∧ isEmail(email)
      ∧ notBlank(fullName)
```

Kết quả hệ thống:
- **Hợp lệ** → `201 Created` + `AuthResponse` (token).
- **Không hợp lệ** → `400 Bad Request` + map lỗi.

---

## Câu 1. Phân hoạch lớp tương đương (Equivalence Partitioning)

| Biến đầu vào | Lớp hợp lệ | Tag | Lớp không hợp lệ | Tag |
|---|---|---|---|---|
| `username` | `3 ≤ len ≤ 50` | **V1** | `len < 3` | **X1** |
| | | | `len > 50` | **X2** |
| | | | rỗng / chỉ khoảng trắng (`@NotBlank`) | **X3** |
| `password` | `len ≥ 6` | **V2** | `len < 6` | **X4** |
| | | | rỗng / null (`@NotBlank`) | **X5** |
| `email` | đúng định dạng `a@b.c` | **V3** | sai định dạng (thiếu `@`, thiếu domain…) | **X6** |
| | | | rỗng / null (`@NotBlank`) | **X7** |
| `fullName` | chuỗi không rỗng | **V4** | rỗng / chỉ khoảng trắng | **X8** |
| `role` | `PATIENT` / `DOCTOR` / `ADMIN` | **V5** | sai giá trị / null → fallback `PATIENT` (không lỗi) | **X9*** |

> `X9*` không sinh lỗi 400 mà được hệ thống tự gán mặc định `PATIENT` — đây là phân vùng "không hợp lệ ở đầu vào nhưng hệ thống xử lý an toàn", cần test để xác nhận hành vi fallback.

Lớp tương đương cho quy tắc nghiệp vụ (tầng service):

| Điều kiện | Lớp hợp lệ | Tag | Lớp không hợp lệ | Tag |
|---|---|---|---|---|
| Trùng `username` | username chưa tồn tại | **V6** | username đã tồn tại | **X10** |
| Trùng `email` | email chưa tồn tại | **V7** | email đã tồn tại | **X11** |

---

## Câu 2. Phân tích giá trị biên (Boundary Value Analysis)

### 2.1. `username` — miền độ dài `[3, 50]` (Standard + Robustness BVA)

| Ký hiệu | Giá trị (độ dài) | Loại | Kết quả mong đợi | Tag |
|---|---:|---|---|---|
| min- | 2 | Robustness (ngoài biên dưới) | Không hợp lệ | **B0** |
| min | 3 | Standard | Hợp lệ | **B1** |
| min+ | 4 | Standard | Hợp lệ | **B2** |
| nominal | 26 | Standard | Hợp lệ | **B3** |
| max- | 49 | Standard | Hợp lệ | **B4** |
| max | 50 | Standard | Hợp lệ | **B5** |
| max+ | 51 | Robustness (ngoài biên trên) | Không hợp lệ | **B6** |

### 2.2. `password` — miền độ dài `[6, ∞)` (chỉ có biên dưới)

| Ký hiệu | Giá trị (độ dài) | Loại | Kết quả mong đợi | Tag |
|---|---:|---|---|---|
| min- | 5 | Robustness (ngoài biên dưới) | Không hợp lệ | **B7** |
| min | 6 | Standard | Hợp lệ | **B8** |
| min+ | 7 | Standard | Hợp lệ | **B9** |
| nominal | 20 | Standard | Hợp lệ | **B10** |

> Vì `@Size(min=6)` không khai báo `max`, biến `password` **không có biên trên** → chỉ áp dụng BVA phía biên dưới. Đây là điểm cần ghi chú rõ trong báo cáo (tránh bịa biên trên không tồn tại).

### 2.3. `email` & `fullName` — biến phi khoảng số

`email` và `fullName` không phải miền số liên tục nên áp dụng EP là chính; "biên" ở đây là ranh giới rỗng/không rỗng và đúng/sai định dạng:

| Biến | Biên kiểm thử | Kết quả mong đợi | Tag |
|---|---|---|---|
| `email` | `""` (rỗng) | Không hợp lệ | **B11** |
| `email` | `"a@b.c"` (định dạng tối thiểu hợp lệ) | Hợp lệ | **B12** |
| `email` | `"not-an-email"` (thiếu `@`) | Không hợp lệ | **B13** |
| `fullName` | `""` / `"   "` | Không hợp lệ | **B14** |
| `fullName` | `"A"` (1 ký tự, tối thiểu không rỗng) | Hợp lệ | **B15** |

---

## Câu 3. Thiết kế test case

Quy ước Expected: **Hợp lệ → 201** | **Không hợp lệ → 400 + lý do**.
Base hợp lệ: `username="valid_user"`, `password="password123"`, `email="user@test.com"`, `fullName="Test User"`, `role="PATIENT"`.

| STT | Tên test case | username (len) | password (len) | email | fullName | Kết quả mong đợi | Tag được bao phủ |
|---:|---|---|---|---|---|---|---|
| 1 | TC_REG_VAL_NOM (tất cả nominal) | 26 | 20 | hợp lệ | "Test User" | Hợp lệ (201) | V1, V2, V3, V4, V5, B3, B10, B12, B15 |
| 2 | TC_REG_VAL_MIN (username & password tại biên min) | 3 | 6 | hợp lệ | "A" | Hợp lệ (201) | V1, V2, B1, B8, B15 |
| 3 | TC_REG_VAL_MINPLUS (min+) | 4 | 7 | hợp lệ | "Test User" | Hợp lệ (201) | V1, V2, B2, B9 |
| 4 | TC_REG_VAL_MAXMINUS (max-) | 49 | 20 | hợp lệ | "Test User" | Hợp lệ (201) | V1, V2, B4, B10 |
| 5 | TC_REG_VAL_USERNAME_MAX (username tại biên max) | 50 | 20 | hợp lệ | "Test User" | Hợp lệ (201) | V1, B5 |
| 6 | TC_REG_INV_USERNAME_LOW | 2 | 20 | hợp lệ | "Test User" | Không hợp lệ (username len=2 < 3) | X1, B0 |
| 7 | TC_REG_INV_USERNAME_HIGH | 51 | 20 | hợp lệ | "Test User" | Không hợp lệ (username len=51 > 50) | X2, B6 |
| 8 | TC_REG_INV_USERNAME_BLANK | 0 (rỗng) | 20 | hợp lệ | "Test User" | Không hợp lệ (username rỗng) | X3 |
| 9 | TC_REG_INV_PASSWORD_LOW | 26 | 5 | hợp lệ | "Test User" | Không hợp lệ (password len=5 < 6) | X4, B7 |
| 10 | TC_REG_INV_PASSWORD_BLANK | 26 | 0 (rỗng) | hợp lệ | "Test User" | Không hợp lệ (password rỗng) | X5 |
| 11 | TC_REG_INV_EMAIL_FORMAT | 26 | 20 | "not-an-email" | "Test User" | Không hợp lệ (email sai định dạng) | X6, B13 |
| 12 | TC_REG_INV_EMAIL_BLANK | 26 | 20 | "" | "Test User" | Không hợp lệ (email rỗng) | X7, B11 |
| 13 | TC_REG_INV_FULLNAME_BLANK | 26 | 20 | hợp lệ | "   " | Không hợp lệ (fullName rỗng) | X8, B14 |
| 14 | TC_REG_INV_ROLE_FALLBACK | 26 | 20 | hợp lệ | "Test User" (role="SUPERUSER") | Hợp lệ (201) — fallback PATIENT | X9*, V1, V2 |
| 15 | TC_REG_INV_DUP_USERNAME | trùng | 20 | hợp lệ | "Test User" | Không hợp lệ (username đã tồn tại) | X10 |
| 16 | TC_REG_INV_DUP_EMAIL | hợp lệ | 20 | trùng | "Test User" | Không hợp lệ (email đã tồn tại) | X11 |

**Bao phủ:** 16 TC > tối thiểu 8; có valid + invalid; có biên (B0–B15); mỗi expected không hợp lệ đều có lý do.

---

## Câu 4. Triển khai kiểm thử tự động

### 4.1. Tầng validation đầu vào (EP/BVA) — JUnit 5 + Jakarta Validator

File: `backend/src/test/java/com/doctorbooking/backend/dto/RegisterRequestValidationTest.java`

Test dùng `jakarta.validation.Validator` để kiểm tra trực tiếp các ràng buộc `@Size`, `@Email`, `@NotBlank` của `RegisterRequest` tại đúng các giá trị biên ở Câu 2 (TC 1–13). Đây là phần **được bổ sung mới** để lấp lỗ hổng: `AuthServiceTest` cũ chưa kiểm thử biên độ dài `username`/`password`.

### 4.2. Tầng nghiệp vụ (trùng username/email, fallback role) — JUnit 5 + Mockito

File có sẵn: `backend/src/test/java/com/doctorbooking/backend/service/AuthServiceTest.java`
Bao phủ TC 14, 15, 16:
- `register_invalidRole_defaultsToPatient` → **X9*** (TC 14)
- `register_fails_usernameExists` → **X10** (TC 15)
- `register_fails_emailExists` → **X11** (TC 16)

### 4.3. Tầng API end-to-end — Postman/Newman

File có sẵn: `postman/test_doctor_booking_2026/`
- Username `2/3/50/51` ký tự, Password `5/6` ký tự, email sai định dạng → bao phủ B0–B9, B13 ở mức HTTP.

### 4.4. Tầng UI E2E — CodeceptJS (Blackbox BVA)

File: `frontend/e2e/tests/blackbox/register_bva_test.cjs` (tag `@bva`)

| Scenario | Tag BVA | Mô tả |
|---|---|---|
| Username 2 ký tự → HTML5 chặn | REG-B0, REG-B1 | UI minLength=3 |
| Username 51 ký tự → API 400 | REG-B6 | Không có maxLength UI |
| Email sai định dạng | REG-B13 | HTML5 `type="email"` chặn submit (validity.valid = false) |
| Password 5 ký tự → HTML5 chặn | REG-B7 | UI minLength=6 |
| Username 3 ký tự → thành công | REG-B2, REG-B3 | Biên dưới hợp lệ |

Chạy: `cd frontend && npx codeceptjs run --grep @bva --grep register`

---

## Bảng truy vết tag → vị trí kiểm thử (Traceability Matrix)

| Tag | Mô tả | Kiểm thử tự động (file / test) |
|---|---|---|
| V1, B1, B2, B3, B4, B5 | username trong/biên hợp lệ | `RegisterRequestValidationTest` (username valid cases) |
| X1, B0 | username < 3 | `RegisterRequestValidationTest#username_belowMin_invalid` |
| X2, B6 | username > 50 | `RegisterRequestValidationTest#username_aboveMax_invalid` |
| X3 | username rỗng | `RegisterRequestValidationTest#username_blank_invalid` |
| V2, B8, B9, B10 | password hợp lệ | `RegisterRequestValidationTest` (password valid cases) |
| X4, B7 | password < 6 | `RegisterRequestValidationTest#password_belowMin_invalid` |
| X5 | password rỗng | `RegisterRequestValidationTest#password_blank_invalid` |
| V3, B12 | email hợp lệ | `RegisterRequestValidationTest#email_valid` |
| X6, B13 | email sai định dạng | `RegisterRequestValidationTest#email_invalidFormat_invalid` |
| X7, B11 | email rỗng | `RegisterRequestValidationTest#email_blank_invalid` |
| V4, B15 | fullName hợp lệ | `RegisterRequestValidationTest#fullName_valid` |
| X8, B14 | fullName rỗng | `RegisterRequestValidationTest#fullName_blank_invalid` |
| X9* | role sai → fallback PATIENT | `AuthServiceTest#register_invalidRole_defaultsToPatient` |
| X10 | username trùng | `AuthServiceTest#register_fails_usernameExists` |
| X11 | email trùng | `AuthServiceTest#register_fails_emailExists` |

---

## Ghi chú về khác biệt so với mẫu "đăng ký học phần"

Bài mẫu dùng 4 biến số nguyên/thực (`tinChi`, `gpa`, `monNo`, `hocKy`) với biên `[min,max]` rõ ràng. Chức năng Register của dự án dùng ràng buộc **độ dài chuỗi** và **định dạng**, nên:
- BVA áp dụng trên **độ dài chuỗi** thay vì giá trị số.
- `password` chỉ có **biên dưới** (không có max) → không bịa biên trên.
- `email`/`fullName` thiên về **EP định dạng/rỗng** hơn là BVA số học.

Phương pháp (EP để chia vùng, BVA để chọn giá trị sát ranh giới, gắn tag để truy vết coverage) **được giữ nguyên đúng chuẩn template**.
