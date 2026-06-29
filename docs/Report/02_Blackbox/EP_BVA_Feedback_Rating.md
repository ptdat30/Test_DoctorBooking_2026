# Kiểm thử hộp đen chức năng Đánh giá bác sĩ (Feedback Rating)

> **Dự án:** Doctor Booking System 2026
> **Kỹ thuật:** Equivalence Partitioning (EP) + Boundary Value Analysis (BVA)
> **Đối tượng kiểm thử:** `POST /api/patient/feedbacks` → `CreateFeedbackRequest` + `FeedbackService.createFeedback()`
> **Prefix tag:** `FBR`

---

## 0. Đặc tả đầu vào (lấy trực tiếp từ code)

`backend/.../dto/request/CreateFeedbackRequest.java` (và `UpdateFeedbackRequest.java` cùng ràng buộc rating):

| Biến đầu vào | Ý nghĩa | Kiểu | Ràng buộc trong code | Miền hợp lệ |
|---|---|---|---|---|
| `rating` | Số sao đánh giá | Integer | `@NotNull` + `@Min(1)` + `@Max(5)` | `1 ≤ rating ≤ 5` |
| `appointmentId` | Lịch khám được đánh giá | Long | *(không annotation)*; kiểm tra ở service | phải tồn tại + đã COMPLETED + thuộc patient |
| `comment` | Nội dung nhận xét | String | *(không ràng buộc)* | bất kỳ / null |

Quy tắc nghiệp vụ (trong `FeedbackService.createFeedback()`):
- Appointment không tồn tại → `RuntimeException("Appointment not found")`.
- Appointment không thuộc patient → `RuntimeException("Appointment does not belong to this patient")`.
- Appointment chưa COMPLETED → `RuntimeException("Can only create feedback for completed appointments")`.
- Đã có feedback cho appointment → `RuntimeException("Feedback already exists for this appointment")`.

Kết quả:
- **Hợp lệ** → `201 Created` + `FeedbackResponse`.
- **Không hợp lệ** → `400 Bad Request` (validation hoặc business rule).

---

## Câu 1. Phân hoạch lớp tương đương (EP)

| Biến | Lớp hợp lệ | Tag | Lớp không hợp lệ | Tag |
|---|---|---|---|---|
| `rating` | `1 ≤ rating ≤ 5` | **FBR-V1** | `rating < 1` (≤ 0) | **FBR-X1** |
| | | | `rating > 5` (≥ 6) | **FBR-X2** |
| | | | `rating = null` (`@NotNull`) | **FBR-X3** |
| `appointmentId` (rule) | tồn tại + COMPLETED + thuộc patient | **FBR-V2** | không tồn tại | **FBR-X4** |
| | | | chưa COMPLETED | **FBR-X5** |
| | | | không thuộc patient | **FBR-X6** |
| | | | đã có feedback (trùng) | **FBR-X7** |

---

## Câu 2. Phân tích giá trị biên (BVA) — rating miền `[1, 5]`

Standard BVA (giá trị hợp lệ) + Robustness BVA (giá trị ngoài biên):

| Ký hiệu | Giá trị | Loại | Kết quả mong đợi | Tag |
|---|---:|---|---|---|
| min- | 0 | Robustness (ngoài biên dưới) | Không hợp lệ | **FBR-B0** |
| min | 1 | Standard | Hợp lệ | **FBR-B1** |
| min+ | 2 | Standard | Hợp lệ | **FBR-B2** |
| nominal | 3 | Standard | Hợp lệ | **FBR-B3** |
| max- | 4 | Standard | Hợp lệ | **FBR-B4** |
| max | 5 | Standard | Hợp lệ | **FBR-B5** |
| max+ | 6 | Robustness (ngoài biên trên) | Không hợp lệ | **FBR-B6** |

---

## Câu 3. Thiết kế test case

Base hợp lệ: `appointmentId` hợp lệ (COMPLETED, thuộc patient, chưa có feedback), `comment="Good"`.

| STT | Tên test case | rating | appointment | Kết quả mong đợi | Tag được bao phủ |
|--:|---|---:|---|---|---|
| 1 | TC_FBR_VAL_MIN | 1 | hợp lệ | Hợp lệ (201) | FBR-V1, FBR-V2, FBR-B1 |
| 2 | TC_FBR_VAL_MINPLUS | 2 | hợp lệ | Hợp lệ (201) | FBR-V1, FBR-B2 |
| 3 | TC_FBR_VAL_NOM | 3 | hợp lệ | Hợp lệ (201) | FBR-V1, FBR-B3 |
| 4 | TC_FBR_VAL_MAXMINUS | 4 | hợp lệ | Hợp lệ (201) | FBR-V1, FBR-B4 |
| 5 | TC_FBR_VAL_MAX | 5 | hợp lệ | Hợp lệ (201) | FBR-V1, FBR-B5 |
| 6 | TC_FBR_INV_LOW | 0 | hợp lệ | Không hợp lệ (rating=0 < 1) | FBR-X1, FBR-B0 |
| 7 | TC_FBR_INV_HIGH | 6 | hợp lệ | Không hợp lệ (rating=6 > 5) | FBR-X2, FBR-B6 |
| 8 | TC_FBR_INV_NULL | null | hợp lệ | Không hợp lệ (rating null) | FBR-X3 |
| 9 | TC_FBR_INV_APT_NOTFOUND | 3 | không tồn tại | Không hợp lệ (appointment not found) | FBR-X4 |
| 10 | TC_FBR_INV_APT_NOTCOMPLETED | 3 | PENDING | Không hợp lệ (chưa COMPLETED) | FBR-X5 |
| 11 | TC_FBR_INV_APT_WRONGPATIENT | 3 | của patient khác | Không hợp lệ (không thuộc patient) | FBR-X6 |
| 12 | TC_FBR_INV_DUPLICATE | 3 | đã có feedback | Không hợp lệ (feedback đã tồn tại) | FBR-X7 |

12 TC > tối thiểu 8; đủ valid + invalid + biên (FBR-B0..B6).

---

## Câu 4. Triển khai kiểm thử tự động

### 4.1. Tầng validation DTO (rating BVA) — JUnit 5 + Jakarta Validator
File **mới**: `backend/src/test/java/com/doctorbooking/backend/dto/FeedbackRequestValidationTest.java`
Test `@Min(1)/@Max(5)/@NotNull` tại các biên 0,1,2,3,4,5,6,null → bao phủ FBR-B0..B6, FBR-X1, FBR-X2, FBR-X3.

### 4.2. Tầng nghiệp vụ (rule appointment) — JUnit 5 + Mockito
File có sẵn: `FeedbackServiceTest.java` (createFeedback success/notCompleted/wrongPatient/duplicate) → FBR-V2, FBR-X4..X7.

### 4.3. Tầng API — Postman/Newman
`07_Patient_Feedbacks`: Rating 0/1/5/6, missing rating → FBR-B0,B1,B5,B6,X3 ở mức HTTP.

### 4.4. Tầng UI E2E — CodeceptJS (Blackbox BVA)

File: `frontend/e2e/tests/blackbox/feedback_rating_bva_test.cjs` (tag `@bva`)

| Scenario | Tag | Mô tả |
|---|---|---|
| Rating 1 sao → thành công | FBR-B1 | Biên dưới hợp lệ |
| Rating 5 sao → thành công | FBR-B5 | Biên trên hợp lệ |

> Rating 0/6 không test được qua UI (chỉ có nút 1–5 sao); đã bao phủ ở JUnit DTO.

Chạy: `cd frontend && npx codeceptjs run --grep @bva --grep feedback`

---

## Bảng truy vết tag → test

| Tag | Mô tả | Test tự động |
|---|---|---|
| FBR-V1, FBR-B1..B5 | rating hợp lệ trong biên | `FeedbackRequestValidationTest` (valid cases) |
| FBR-X1, FBR-B0 | rating ≤ 0 | `FeedbackRequestValidationTest#rating_belowMin_invalid` |
| FBR-X2, FBR-B6 | rating ≥ 6 | `FeedbackRequestValidationTest#rating_aboveMax_invalid` |
| FBR-X3 | rating null | `FeedbackRequestValidationTest#rating_null_invalid` |
| FBR-V2 | appointment hợp lệ | `FeedbackServiceTest#createFeedback_success` |
| FBR-X4 | appointment không tồn tại | `FeedbackServiceTest` (not found) |
| FBR-X5 | appointment chưa COMPLETED | `FeedbackServiceTest#createFeedback_appointmentNotCompleted_throwsException` |
| FBR-X6 | appointment sai patient | `FeedbackServiceTest#createFeedback_appointmentNotBelongToPatient_throwsException` |
| FBR-X7 | feedback trùng | `FeedbackServiceTest#createFeedback_alreadyExists_throwsException` |

---

## Ghi chú

`rating` là số nguyên rời rạc miền `[1,5]` → đây là ví dụ BVA "sách giáo khoa" rõ nhất trong dự án. `comment` không ràng buộc nên không đưa vào BVA.
