# Kiểm thử hộp đen chức năng Health AI (Symptom Check)

> **Dự án:** Doctor Booking System 2026
> **Kỹ thuật:** Equivalence Partitioning (EP) + Boundary Value Analysis (BVA) trên `@NotBlank`
> **Đối tượng kiểm thử:** `POST /api/patient/ai/check-symptoms` → `SymptomCheckRequest`
> **Prefix tag:** `HAI`

---

## 0. Đặc tả đầu vào

`SymptomCheckRequest.java`:

| Biến | Ràng buộc | Miền hợp lệ |
|---|---|---|
| `symptoms` | `@NotBlank` | Chuỗi không rỗng (sau trim ở controller) |

Frontend `HealthAIChat.jsx`: nút gửi `disabled={!inputValue.trim()}`.

---

## Câu 1. Phân hoạch lớp tương đương (EP)

| Biến | Lớp hợp lệ | Tag | Lớp không hợp lệ | Tag |
|---|---|---|---|---|
| `symptoms` | không rỗng | **HAI-V1** | rỗng `""` | **HAI-X1** |
| | | | chỉ khoảng trắng | **HAI-X2** |
| | | | `null` | **HAI-X3** |

---

## Câu 2. Phân tích giá trị biên (BVA)

| Giá trị | Kết quả | Tag |
|---|---|---|
| `""` | Không hợp lệ | **HAI-B0** |
| `"   "` | Không hợp lệ | **HAI-B1** |
| `"a"` (1 ký tự) | Hợp lệ | **HAI-B2** |
| `"Đau đầu nhẹ"` | Hợp lệ (nominal) | **HAI-B3** |

---

## Câu 3. Test case

| STT | symptoms | Kết quả | Tag |
|--:|---|---|---|
| 1 | `"Đau đầu"` | Hợp lệ (200) | HAI-V1, HAI-B3 |
| 2 | `""` | Không hợp lệ (400) | HAI-X1, HAI-B0 |
| 3 | `"   "` | Không hợp lệ (400) | HAI-X2, HAI-B1 |
| 4 | `null` | Không hợp lệ (400) | HAI-X3 |

---

## Câu 4. Triển khai kiểm thử tự động

### 4.1. JUnit DTO — `SymptomCheckRequestValidationTest.java`
Bao phủ HAI-V1, HAI-X1, HAI-X2, HAI-B0, HAI-B1.

### 4.2. E2E CodeceptJS — `frontend/e2e/tests/blackbox/health_ai_bva_test.cjs`

| Scenario | Tag |
|---|---|
| Input rỗng → send disabled | HAI-B0 |
| Input hợp lệ → gửi thành công (mock API) | HAI-B2, HAI-V1 |

Chạy: `cd frontend && npx codeceptjs run --grep @bva --grep ai`

---

## Bảng truy vết tag → test

| Tag | Test |
|---|---|
| HAI-V1, HAI-B2, HAI-B3 | `SymptomCheckRequestValidationTest#symptoms_valid_noViolation` |
| HAI-X1, HAI-B0 | `SymptomCheckRequestValidationTest#symptoms_blank_invalid` |
| HAI-X2, HAI-B1 | `SymptomCheckRequestValidationTest#symptoms_whitespace_invalid` |
| HAI-X3 | `SymptomCheckRequestValidationTest#symptoms_null_invalid` |
| HAI-B0 | `health_ai_bva_test.cjs` — send disabled |
| HAI-B2 | `health_ai_bva_test.cjs` — send with mock |
