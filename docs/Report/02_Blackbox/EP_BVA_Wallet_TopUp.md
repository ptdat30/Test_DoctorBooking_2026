# Kiểm thử hộp đen chức năng Nạp tiền ví (Wallet Top-up)

> **Dự án:** Doctor Booking System 2026
> **Kỹ thuật:** Equivalence Partitioning (EP) + Boundary Value Analysis (BVA)
> **Đối tượng kiểm thử:** `POST /api/patient/wallet/top-up` → `TopUpRequest` + `WalletService.createDepositTransaction()`
> **Prefix tag:** `WAL`

---

## 0. Đặc tả đầu vào (lấy trực tiếp từ code)

`backend/.../dto/request/TopUpRequest.java`:

| Biến đầu vào | Ý nghĩa | Kiểu | Ràng buộc trong code | Miền hợp lệ |
|---|---|---|---|---|
| `amount` | Số tiền nạp (VNĐ) | BigDecimal | `@NotNull` + `@Min(10000)` | `amount ≥ 10,000` (không có max ở DTO) |
| `paymentMethod` | Phương thức | String | `@NotNull` | `VNPAY` / `MOMO` (không enum hoá) |

Ghi chú quan trọng:
- DTO **chỉ có biên dưới** (`@Min(10000)`), **không khai báo biên trên** → chỉ áp dụng BVA phía dưới.
- `WalletService.completeDepositTransaction()` cộng điểm tích lũy = `amount / 100` (1%), sau đó cập nhật hạng (xem `EP_BVA_LoyaltyTier.md`).

Kết quả:
- **Hợp lệ** → `201/200` (khởi tạo giao dịch PENDING + URL thanh toán).
- **Không hợp lệ** → `400 Bad Request`.

---

## Câu 1. Phân hoạch lớp tương đương (EP)

| Biến | Lớp hợp lệ | Tag | Lớp không hợp lệ | Tag |
|---|---|---|---|---|
| `amount` | `amount ≥ 10,000` | **WAL-V1** | `amount < 10,000` | **WAL-X1** |
| | | | `amount = null` (`@NotNull`) | **WAL-X2** |
| | | | `amount ≤ 0` (âm/0 — vẫn < min) | **WAL-X3** |
| `paymentMethod` | `VNPAY` / `MOMO` | **WAL-V2** | `null` (`@NotNull`) | **WAL-X4** |

---

## Câu 2. Phân tích giá trị biên (BVA) — amount miền `[10,000, ∞)`

Chỉ có biên dưới → Standard BVA phía dưới + Robustness ngoài biên dưới:

| Ký hiệu | Giá trị (VNĐ) | Loại | Kết quả mong đợi | Tag |
|---|---:|---|---|---|
| min- | 9,999 | Robustness (ngoài biên dưới) | Không hợp lệ | **WAL-B0** |
| min | 10,000 | Standard | Hợp lệ | **WAL-B1** |
| min+ | 10,001 | Standard | Hợp lệ | **WAL-B2** |
| nominal | 50,000 | Standard | Hợp lệ | **WAL-B3** |
| far below | 100 | Robustness (rất thấp) | Không hợp lệ | **WAL-B4** |

> Không có biên trên trong code → **không** bịa giá trị `max`. Nếu sau này thêm `@Max`, bổ sung `max-`, `max`, `max+`.

---

## Câu 3. Thiết kế test case

Base hợp lệ: `paymentMethod="VNPAY"`.

| STT | Tên test case | amount | paymentMethod | Kết quả mong đợi | Tag được bao phủ |
|--:|---|---:|---|---|---|
| 1 | TC_WAL_VAL_MIN | 10,000 | VNPAY | Hợp lệ (201) | WAL-V1, WAL-V2, WAL-B1 |
| 2 | TC_WAL_VAL_MINPLUS | 10,001 | VNPAY | Hợp lệ (201) | WAL-V1, WAL-B2 |
| 3 | TC_WAL_VAL_NOM | 50,000 | VNPAY | Hợp lệ (201) | WAL-V1, WAL-B3 |
| 4 | TC_WAL_INV_BELOWMIN | 9,999 | VNPAY | Không hợp lệ (amount=9,999 < 10,000) | WAL-X1, WAL-B0 |
| 5 | TC_WAL_INV_FARBELOW | 100 | VNPAY | Không hợp lệ (amount=100 < 10,000) | WAL-X1, WAL-B4 |
| 6 | TC_WAL_INV_ZERO | 0 | VNPAY | Không hợp lệ (amount=0 < 10,000) | WAL-X3 |
| 7 | TC_WAL_INV_NULL | null | VNPAY | Không hợp lệ (amount null) | WAL-X2 |
| 8 | TC_WAL_INV_NOMETHOD | 50,000 | null | Không hợp lệ (paymentMethod null) | WAL-X4 |

8 TC = mức tối thiểu; đủ valid + invalid + biên (WAL-B0..B4).

---

## Câu 4. Triển khai kiểm thử tự động

### 4.1. Tầng validation DTO (amount BVA) — JUnit 5 + Jakarta Validator
File **mới**: `backend/src/test/java/com/doctorbooking/backend/dto/TopUpRequestValidationTest.java`
Test `@Min(10000)/@NotNull` tại 9999, 10000, 10001, 50000, 100, 0, null → bao phủ WAL-B0..B4, WAL-X1, WAL-X2, WAL-X3, WAL-X4.

### 4.2. Tầng nghiệp vụ — JUnit 5 + Mockito
File có sẵn: `WalletServiceTest.java` (createDeposit/completeDeposit/payForAppointment) — kiểm tra cộng/trừ số dư, điểm tích lũy.

### 4.3. Tầng API — Postman/Newman
`09_Patient_Wallet`: Top-Up 9999 (Below Min), 10000 (Min), 10001 (Above Min), 100 (Far Below) → WAL-B0,B1,B2,B4 ở mức HTTP.

### 4.4. Tầng UI E2E — CodeceptJS (Blackbox BVA)

File: `frontend/e2e/tests/blackbox/wallet_bva_test.cjs` (tag `@bva`)

| Scenario | Tag | Mô tả |
|---|---|---|
| Nạp 9.999 VNĐ → nút disabled | WAL-B0 | `HealthWallet.jsx` minAmount |
| Nạp 10.000 VNĐ → nút enabled | WAL-B1 | Biên dưới hợp lệ |
| Nạp 10.001 VNĐ → nút enabled | WAL-B2 | Biên trên hợp lệ |

Chạy: `cd frontend && npx codeceptjs run --grep @bva --grep wallet`

---

## Bảng truy vết tag → test

| Tag | Mô tả | Test tự động |
|---|---|---|
| WAL-V1, WAL-B1, WAL-B2, WAL-B3 | amount hợp lệ ≥ 10,000 | `TopUpRequestValidationTest` (valid cases) |
| WAL-X1, WAL-B0 | amount = 9,999 | `TopUpRequestValidationTest#amount_belowMin_invalid` |
| WAL-X1, WAL-B4 | amount = 100 | `TopUpRequestValidationTest#amount_farBelow_invalid` |
| WAL-X3 | amount = 0 | `TopUpRequestValidationTest#amount_zero_invalid` |
| WAL-X2 | amount null | `TopUpRequestValidationTest#amount_null_invalid` |
| WAL-X4 | paymentMethod null | `TopUpRequestValidationTest#paymentMethod_null_invalid` |

---

## Ghi chú

`amount` là miền số chỉ có biên dưới → minh hoạ tốt cho trường hợp BVA **một phía**. Điểm tích lũy phát sinh từ `amount` được kiểm thử riêng tại `EP_BVA_LoyaltyTier.md`.
