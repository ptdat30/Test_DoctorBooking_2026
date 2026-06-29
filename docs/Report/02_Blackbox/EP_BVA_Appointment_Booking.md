# Kiểm thử hộp đen chức năng Đặt lịch khám (Appointment Booking)

> **Dự án:** Doctor Booking System 2026
> **Kỹ thuật:** Equivalence Partitioning (EP) + Boundary Value Analysis (BVA) trên thời gian/slot
> **Đối tượng kiểm thử:** `POST /api/patient/appointments` → `CreateAppointmentRequest` + `AppointmentService.createAppointment()`
> **Prefix tag:** `APT`

---

## 0. Đặc tả đầu vào (lấy trực tiếp từ code)

`backend/.../dto/request/CreateAppointmentRequest.java`:

| Biến đầu vào | Ý nghĩa | Kiểu | Ràng buộc DTO | Miền hợp lệ |
|---|---|---|---|---|
| `doctorId` | Bác sĩ | Long | `@NotNull` | phải tồn tại + `ACTIVE` |
| `appointmentDate` | Ngày khám | LocalDate | `@NotNull` | `≥ hôm nay` |
| `appointmentTime` | Giờ khám | LocalTime | `@NotNull` | thuộc 17 slot; nếu là hôm nay phải `> giờ hiện tại` |
| `notes` | Ghi chú | String | *(không)* | bất kỳ |
| `paymentMethod` | Thanh toán | String | *(không)* | CASH/WALLET/VNPAY |
| `familyMemberId` | Người nhà | Long | *(không)* | null = đặt cho bản thân |

Danh sách 17 slot cố định (trong `AppointmentService.getAvailableTimeSlots()`):

```
08:00 08:30 09:00 09:30 10:00 10:30 11:00 11:30
13:00 13:30 14:00 14:30 15:00 15:30 16:00 16:30 17:00
```

Quy tắc nghiệp vụ (trong `createAppointment()`):
- Bác sĩ không tồn tại → `RuntimeException("Doctor not found...")`.
- Bác sĩ không ACTIVE → `RuntimeException("Doctor is not active")`.
- Slot đã có người đặt (PENDING/CONFIRMED) → `RuntimeException("Appointment slot is already taken")`.
- Ngày ở quá khứ → `RuntimeException("Cannot book appointment in the past")`.
- Hôm nay + giờ đã trôi qua → `RuntimeException("Cannot book appointment time slot that has already passed today")`.

Kết quả:
- **Hợp lệ** → `201 Created` + `AppointmentResponse`.
- **Không hợp lệ** → `400 Bad Request` (hoặc `404` nếu doctor không tồn tại).

---

## Câu 1. Phân hoạch lớp tương đương (EP)

| Biến | Lớp hợp lệ | Tag | Lớp không hợp lệ | Tag |
|---|---|---|---|---|
| `appointmentDate` | `≥ hôm nay` | **APT-V1** | ngày quá khứ | **APT-X1** |
| | | | null (`@NotNull`) | **APT-X2** |
| `appointmentTime` | thuộc 17 slot, còn ở tương lai | **APT-V2** | giờ đã trôi qua (hôm nay) | **APT-X3** |
| | | | null (`@NotNull`) | **APT-X4** |
| `doctorId` | tồn tại + ACTIVE | **APT-V3** | không tồn tại | **APT-X5** |
| | | | bác sĩ không ACTIVE | **APT-X6** |
| | | | null (`@NotNull`) | **APT-X7** |
| slot | còn trống | **APT-V4** | đã bị đặt (PENDING/CONFIRMED) | **APT-X8** |

---

## Câu 2. Phân tích giá trị biên (BVA) — biên thời gian

### 2.1. Biên `appointmentDate` quanh "hôm nay"

| Ký hiệu | Giá trị | Kết quả mong đợi | Tag |
|---|---|---|---|
| hôm qua | `today - 1 ngày` | Không hợp lệ (quá khứ) | **APT-B0** |
| hôm nay | `today` | Hợp lệ (nếu giờ còn tương lai) | **APT-B1** |
| ngày mai | `today + 1 ngày` | Hợp lệ | **APT-B2** |

### 2.2. Biên `appointmentTime` trong ngày hôm nay (quanh "giờ hiện tại")

| Ký hiệu | Giá trị | Kết quả mong đợi | Tag |
|---|---|---|---|
| trước hiện tại | slot `< now` | Không hợp lệ (đã trôi qua) | **APT-B3** |
| ngay sau hiện tại | slot kế tiếp `> now` | Hợp lệ | **APT-B4** |

### 2.3. Biên danh sách slot (đầu/cuối ngày)

| Ký hiệu | Giá trị | Kết quả mong đợi | Tag |
|---|---|---|---|
| trước slot đầu | `07:30` (ngoài danh sách) | Không hợp lệ (không phải slot chuẩn) | **APT-B5** |
| slot đầu | `08:00` | Hợp lệ | **APT-B6** |
| slot cuối | `17:00` | Hợp lệ | **APT-B7** |
| sau slot cuối | `17:30` (ngoài danh sách) | Không hợp lệ | **APT-B8** |

> Lưu ý: hệ thống **đã chặn** giờ ngoài 17 slot chuẩn tại `AppointmentService.validateTimeSlot()` (APT-B5/B8).

---

## Câu 3. Thiết kế test case

Base hợp lệ: doctor ACTIVE tồn tại, ngày mai, slot `09:00`, `paymentMethod=CASH`.

| STT | Tên test case | date | time | doctor | Kết quả mong đợi | Tag được bao phủ |
|--:|---|---|---|---|---|---|
| 1 | TC_APT_VAL_TOMORROW | ngày mai | 09:00 | ACTIVE | Hợp lệ (201) | APT-V1, APT-V2, APT-V3, APT-V4, APT-B2 |
| 2 | TC_APT_VAL_TODAY_FUTURE | hôm nay | slot > now | ACTIVE | Hợp lệ (201) | APT-V1, APT-B1, APT-B4 |
| 3 | TC_APT_VAL_FIRSTSLOT | ngày mai | 08:00 | ACTIVE | Hợp lệ (201) | APT-V2, APT-B6 |
| 4 | TC_APT_VAL_LASTSLOT | ngày mai | 17:00 | ACTIVE | Hợp lệ (201) | APT-V2, APT-B7 |
| 5 | TC_APT_INV_PASTDATE | hôm qua | 09:00 | ACTIVE | Không hợp lệ (ngày quá khứ) | APT-X1, APT-B0 |
| 6 | TC_APT_INV_TODAY_PAST | hôm nay | slot < now | ACTIVE | Không hợp lệ (giờ đã trôi qua) | APT-X3, APT-B3 |
| 7 | TC_APT_INV_SLOTTAKEN | ngày mai | slot đã đặt | ACTIVE | Không hợp lệ (slot đã bị đặt) | APT-X8 |
| 8 | TC_APT_INV_DOCTOR_NOTFOUND | ngày mai | 09:00 | id=999999 | Không hợp lệ (doctor not found, 404) | APT-X5 |
| 9 | TC_APT_INV_DOCTOR_INACTIVE | ngày mai | 09:00 | INACTIVE | Không hợp lệ (doctor not active) | APT-X6 |
| 10 | TC_APT_INV_MISSING_DOCTORID | ngày mai | 09:00 | null | Không hợp lệ (doctorId null) | APT-X7 |
| 11 | TC_APT_INV_OUTOFSLOT_EARLY | ngày mai | 07:30 | ACTIVE | Không hợp lệ (ngoài 17 slot) | APT-B5 |
| 12 | TC_APT_INV_OUTOFSLOT_LATE | ngày mai | 17:30 | ACTIVE | Không hợp lệ (ngoài 17 slot) | APT-B8 |

---

## Câu 4. Triển khai kiểm thử tự động

### 4.1. Tầng nghiệp vụ — JUnit 5 + Mockito
File có sẵn: `backend/src/test/java/com/doctorbooking/backend/service/AppointmentServiceTest.java`
Bao phủ: slot trống/đã đặt, doctor not found/inactive, past date/time → APT-V*, APT-X1, APT-X3, APT-X5, APT-X6, APT-X8.

### 4.2. Tầng API — Postman/Newman
`05_Patient_Appointments`: Missing doctorId (APT-X7), Invalid time type (APT-X4), Not found (APT-X5), No auth (403).

### 4.3. Validate 17 slot chuẩn (đã khắc phục)
`AppointmentService.validateTimeSlot()` + `AppointmentServiceTest#createAppointment_invalidTimeSlot_throwsException` → APT-B5, APT-B8.

### 4.4. Tầng UI E2E — CodeceptJS (Blackbox BVA)

File: `frontend/e2e/tests/blackbox/booking_bva_test.cjs` (tag `@bva`)

| Scenario | Tag | Mô tả |
|---|---|---|
| Ngày quá khứ bị chặn | APT-B0 | Input `min=today` (HTML5) + không có slot khả dụng cho ngày quá khứ |
| Slot 08:00 và 17:00 trong dropdown | APT-B6, APT-B7 | 17 slot chuẩn hiển thị UI |

Chạy: `cd frontend && npx codeceptjs run --grep @bva --grep booking`

---

## Bảng truy vết tag → test

| Tag | Mô tả | Test tự động |
|---|---|---|
| APT-V1..V4, APT-B1, APT-B2, APT-B4, APT-B6, APT-B7 | đặt lịch hợp lệ | `AppointmentServiceTest` (create success) |
| APT-X1, APT-B0 | ngày quá khứ | `AppointmentServiceTest` (past date) |
| APT-X3, APT-B3 | giờ đã trôi qua hôm nay | `AppointmentServiceTest` (past time today) |
| APT-X5 | doctor không tồn tại | `AppointmentServiceTest#createAppointment_doctorNotFound_throwsException` |
| APT-X6 | doctor không ACTIVE | `AppointmentServiceTest#createAppointment_doctorNotActive_throwsException` |
| APT-X7 | doctorId null | Postman `POST Appointment - Missing doctorId` |
| APT-X8 | slot đã bị đặt | `AppointmentServiceTest` (slot taken) |
| APT-B5, APT-B8 | giờ ngoài 17 slot | `AppointmentServiceTest#createAppointment_invalidTimeSlot_throwsException` |

---

## Ghi chú

Đây là ví dụ BVA trên **biên thời gian** (ngày so với hôm nay, giờ so với hiện tại) và **biên tập hợp rời rạc** (17 slot cố định) — khác với BVA số học. Các biên đầu/cuối danh sách slot (`08:00`, `17:00`) và lân cận (`07:30`, `17:30`) là điểm kiểm thử quan trọng.
