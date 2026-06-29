# Kiểm thử hộp đen chức năng Sửa đánh giá trong 24 giờ (Feedback Edit Window)

> **Dự án:** Doctor Booking System 2026
> **Kỹ thuật:** Boundary Value Analysis (BVA) trên **mốc thời gian**
> **Đối tượng kiểm thử:** `PUT /api/patient/feedbacks/{id}` → `FeedbackService.updateFeedback()`
> **Prefix tag:** `FBT`

---

## 0. Đặc tả đầu vào (lấy trực tiếp từ code)

`backend/.../service/FeedbackService.java`:

```java
private static final int EDIT_WINDOW_HOURS = 24;
...
if (feedback.getDoctorReply() != null)
    throw new RuntimeException("Cannot edit feedback after doctor has replied");
if (feedback.getCreatedAt().plusHours(EDIT_WINDOW_HOURS).isBefore(LocalDateTime.now()))
    throw new RuntimeException("Feedback can only be edited within 24 hours");
```

| Biến đầu vào | Ý nghĩa | Kiểu | Quy tắc |
|---|---|---|---|
| `feedback.createdAt` | Thời điểm tạo feedback | LocalDateTime | sửa được nếu `createdAt + 24h ≥ now` |
| `feedback.doctorReply` | Bác sĩ đã phản hồi chưa | String/null | nếu khác null → khoá, không cho sửa |
| `rating` (body) | Điểm mới | Integer | `@Min(1)@Max(5)` (xem `EP_BVA_Feedback_Rating.md`) |

Điều kiện sửa được:
```
canEdit = (doctorReply == null) ∧ (createdAt + 24h ≥ now)
```

Kết quả:
- **Hợp lệ** → `200 OK`, feedback được cập nhật.
- **Không hợp lệ** → `400` (quá 24h hoặc đã có phản hồi bác sĩ).

---

## Câu 1. Phân hoạch lớp tương đương (EP)

| Điều kiện | Lớp hợp lệ | Tag | Lớp không hợp lệ | Tag |
|---|---|---|---|---|
| Khoảng cách thời gian | `tuổi feedback ≤ 24h` | **FBT-V1** | `tuổi feedback > 24h` | **FBT-X1** |
| Trạng thái phản hồi | `doctorReply == null` | **FBT-V2** | `doctorReply != null` | **FBT-X2** |
| Quyền sở hữu | feedback thuộc patient | **FBT-V3** | feedback của người khác | **FBT-X3** |

---

## Câu 2. Phân tích giá trị biên (BVA) — mốc 24 giờ

Biên là **đúng 24 giờ** kể từ `createdAt`. Kiểm thử ngay dưới, đúng, và ngay trên biên:

| Ký hiệu | Tuổi feedback | Loại | Kết quả mong đợi | Tag |
|---|---|---|---|---|
| min+ (trong biên) | 23h 59m 59s | Standard | Hợp lệ (còn trong cửa sổ) | **FBT-B1** |
| đúng biên | 24h 00m 00s | Standard | Hợp lệ (chưa "isBefore now") | **FBT-B2** |
| max+ (ngoài biên) | 24h 00m 01s | Robustness | Không hợp lệ (quá hạn) | **FBT-B3** |

> Logic dùng `isBefore` nên **đúng 24h vẫn cho sửa** (chỉ khi vượt qua mới chặn). Đây là chi tiết biên quan trọng dễ sai (off-by-one thời gian).

---

## Câu 3. Thiết kế test case

Base: feedback thuộc patient hiện tại, `doctorReply == null`, rating mới hợp lệ.

| STT | Tên test case | tuổi feedback | doctorReply | Kết quả mong đợi | Tag được bao phủ |
|--:|---|---|---|---|---|
| 1 | TC_FBT_VAL_WITHIN | 23h 59m 59s | null | Hợp lệ (200) | FBT-V1, FBT-V2, FBT-B1 |
| 2 | TC_FBT_VAL_EXACTLY24 | 24h 00m 00s | null | Hợp lệ (200) | FBT-V1, FBT-B2 |
| 3 | TC_FBT_INV_AFTER24 | 24h 00m 01s | null | Không hợp lệ (quá 24h) | FBT-X1, FBT-B3 |
| 4 | TC_FBT_INV_REPLIED | 1h | có reply | Không hợp lệ (đã có phản hồi BS) | FBT-X2 |
| 5 | TC_FBT_INV_WRONGPATIENT | 1h | null (feedback người khác) | Không hợp lệ (không thuộc patient) | FBT-X3 |

5 TC tập trung vào biên thời gian (đủ `-ε / = / +ε` quanh 24h) + 2 rule chặn.

---

## Câu 4. Triển khai kiểm thử tự động

### Tầng nghiệp vụ — JUnit 5 + Mockito (đã có sẵn)
File có sẵn: `backend/src/test/java/com/doctorbooking/backend/service/FeedbackServiceTest.java`

- `updateFeedback_bva_within24Hours_succeeds` → FBT-B1
- `updateFeedback_bva_exactly24Hours_succeeds` → FBT-B2
- `updateFeedback_bva_after24Hours_throwsException` → FBT-B3
- `updateFeedback_afterDoctorReply_throwsException` → FBT-X2
- `updateFeedback_wrongPatient_throwsException` → FBT-X3

> Chức năng này đã có **BVA thời gian đầy đủ** ở tầng JUnit — không cần bổ sung test Mockito.

### 4.2. Tầng UI E2E — CodeceptJS (Blackbox BVA)

File: `frontend/e2e/tests/blackbox/feedback_edit_bva_test.cjs` (tag `@bva`)

| Scenario | Tag | Mô tả |
|---|---|---|
| `canEdit=true` → chỉnh sửa thành công | FBT-V1 | Mock API + UI modal |
| `canEdit=false` (quá 24h) → không có nút sửa | FBT-X1 | Hiển thị "quá 24h" |

Chạy: `cd frontend && npx codeceptjs run --grep @bva --grep feedback`

---

## Bảng truy vết tag → test

| Tag | Mô tả | Test tự động |
|---|---|---|
| FBT-V1, FBT-B1 | sửa ở 23h59m59s | `FeedbackServiceTest#updateFeedback_bva_within24Hours_succeeds` |
| FBT-B2 | sửa đúng 24h | `FeedbackServiceTest#updateFeedback_bva_exactly24Hours_succeeds` |
| FBT-X1, FBT-B3 | sửa sau 24h | `FeedbackServiceTest#updateFeedback_bva_after24Hours_throwsException` |
| FBT-X2 | đã có phản hồi BS | `FeedbackServiceTest#updateFeedback_afterDoctorReply_throwsException` |
| FBT-X3 | feedback người khác | `FeedbackServiceTest#updateFeedback_wrongPatient_throwsException` |

---

## Ghi chú

Đây là ví dụ BVA trên **trục thời gian** thay vì số học. Mốc "đúng 24h" là biên nhạy cảm với lỗi off-by-one (`isBefore` vs `isAfter` vs `!isAfter`); 3 test quanh biên đảm bảo hành vi đúng đặc tả "trong vòng 24 giờ".
