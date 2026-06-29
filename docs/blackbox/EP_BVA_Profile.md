# Kiểm thử hộp đen — Đổi mật khẩu Profile (Password)

> **Dự án:** Doctor Booking System 2026
> **Kỹ thuật:** BVA trên độ dài tối thiểu (min length = 6)
> **Đối tượng:** `PatientProfile.jsx` → `handleChangePassword` + API `changePassword`
> **Prefix tag:** `PRF`

---

## 0. Đặc tả

| Biến | Ràng buộc UI | Ràng buộc backend |
|---|---|---|
| `newPassword` | `length < 6` → lỗi UI | `@Size(min=6)` trên DTO đổi mật khẩu |

Thông báo lỗi UI: `"Password must be at least 6 characters"`.

---

## Câu 1. EP

| Lớp hợp lệ | Tag | Lớp không hợp lệ | Tag |
|---|---|---|---|
| `length ≥ 6` | **PRF-V1** | `length < 6` | **PRF-X1** |
| khớp confirm | **PRF-V2** | confirm không khớp | **PRF-X2** |

---

## Câu 2. BVA (độ dài password)

| Giá trị | Kết quả | Tag |
|---|---|---|
| 5 ký tự | Không hợp lệ | **PRF-B7** |
| 6 ký tự | Hợp lệ | **PRF-B8** |
| 7 ký tự | Hợp lệ | **PRF-B9** |

---

## Câu 4. Triển khai tự động

### E2E CodeceptJS — `frontend/e2e/tests/blackbox/profile_bva_test.cjs`

| Scenario | Tag |
|---|---|
| Mật khẩu mới 5 ký tự → HTML5 `minLength=6` chặn submit (validity.tooShort) | PRF-B7, PRF-X1 |

Happy path đổi mật khẩu: `frontend/e2e/tests/patient/profile_test.cjs` (TC-PROFILE-02).

Chạy: `cd frontend && npx codeceptjs run --grep @bva --grep profile`

---

## Truy vết

| Tag | Test |
|---|---|
| PRF-B7, PRF-X1 | `profile_bva_test.cjs` |
| PRF-B8, PRF-V1 | `profile_test.cjs` TC-PROFILE-02 |
