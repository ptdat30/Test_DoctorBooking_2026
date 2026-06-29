# Kiểm thử hộp đen chức năng Hạng thành viên (Loyalty Tier)

> **Dự án:** Doctor Booking System 2026
> **Kỹ thuật:** Equivalence Partitioning (EP) + Boundary Value Analysis (BVA) — đa biên (multi-boundary)
> **Đối tượng kiểm thử:** `WalletService.updateLoyaltyTier(Patient)` (private, kiểm thử gián tiếp qua điểm tích lũy)
> **Prefix tag:** `LOY`

---

## 0. Đặc tả đầu vào (lấy trực tiếp từ code)

`backend/.../service/WalletService.java` → `updateLoyaltyTier()`:

```java
if (points >= 10000)      tier = "PLATINUM";
else if (points >= 5000)  tier = "GOLD";
else if (points >= 1000)  tier = "SILVER";
else                      tier = "BRONZE";
```

| Biến đầu vào | Ý nghĩa | Kiểu | Miền giá trị |
|---|---|---|---|
| `loyaltyPoints` | Điểm tích lũy của patient | Integer (null → 0) | `[0, ∞)` |

Ánh xạ hạng:

| Hạng | Điều kiện điểm |
|---|---|
| BRONZE | `0 ≤ points < 1000` |
| SILVER | `1000 ≤ points < 5000` |
| GOLD | `5000 ≤ points < 10000` |
| PLATINUM | `points ≥ 10000` |

Đây là bài toán **nhiều biên liên tiếp** (3 ngưỡng: 1000, 5000, 10000). BVA kiểm thử quanh **mỗi ngưỡng**.

---

## Câu 1. Phân hoạch lớp tương đương (EP)

| Lớp tương đương | Khoảng điểm | Kết quả mong đợi | Tag |
|---|---|---|---|
| Vùng BRONZE | `0 ≤ points < 1000` | BRONZE | **LOY-V1** |
| Vùng SILVER | `1000 ≤ points < 5000` | SILVER | **LOY-V2** |
| Vùng GOLD | `5000 ≤ points < 10000` | GOLD | **LOY-V3** |
| Vùng PLATINUM | `points ≥ 10000` | PLATINUM | **LOY-V4** |
| Điểm âm (không xảy ra do `Math.max(0,...)`) | `points < 0` → coi như 0 | BRONZE | **LOY-X1*** |

> `LOY-X1*`: code dùng `Math.max(0, ...)` khi trừ điểm nên điểm không bao giờ âm; test xác nhận hành vi clamp về 0 → BRONZE.

---

## Câu 2. Phân tích giá trị biên (BVA) — quanh 3 ngưỡng

Với mỗi ngưỡng `T`, kiểm thử `T-1` (dưới biên), `T` (đúng biên), `T+1` (trên biên):

| Ký hiệu | Điểm | Hạng mong đợi | Tag |
|---|---:|---|---|
| tuyệt đối dưới | 0 | BRONZE | **LOY-B0** |
| ngưỡng SILVER -1 | 999 | BRONZE | **LOY-B1** |
| ngưỡng SILVER | 1000 | SILVER | **LOY-B2** |
| ngưỡng SILVER +1 | 1001 | SILVER | **LOY-B3** |
| ngưỡng GOLD -1 | 4999 | SILVER | **LOY-B4** |
| ngưỡng GOLD | 5000 | GOLD | **LOY-B5** |
| ngưỡng GOLD +1 | 5001 | GOLD | **LOY-B6** |
| ngưỡng PLATINUM -1 | 9999 | GOLD | **LOY-B7** |
| ngưỡng PLATINUM | 10000 | PLATINUM | **LOY-B8** |
| ngưỡng PLATINUM +1 | 10001 | PLATINUM | **LOY-B9** |

---

## Câu 3. Thiết kế test case

| STT | Tên test case | points | Hạng mong đợi | Tag được bao phủ |
|--:|---|---:|---|---|
| 1 | TC_LOY_BVA_0 | 0 | BRONZE | LOY-V1, LOY-B0 |
| 2 | TC_LOY_BVA_999 | 999 | BRONZE | LOY-V1, LOY-B1 |
| 3 | TC_LOY_BVA_1000 | 1000 | SILVER | LOY-V2, LOY-B2 |
| 4 | TC_LOY_BVA_1001 | 1001 | SILVER | LOY-V2, LOY-B3 |
| 5 | TC_LOY_BVA_4999 | 4999 | SILVER | LOY-V2, LOY-B4 |
| 6 | TC_LOY_BVA_5000 | 5000 | GOLD | LOY-V3, LOY-B5 |
| 7 | TC_LOY_BVA_5001 | 5001 | GOLD | LOY-V3, LOY-B6 |
| 8 | TC_LOY_BVA_9999 | 9999 | GOLD | LOY-V3, LOY-B7 |
| 9 | TC_LOY_BVA_10000 | 10000 | PLATINUM | LOY-V4, LOY-B8 |
| 10 | TC_LOY_BVA_10001 | 10001 | PLATINUM | LOY-V4, LOY-B9 |
| 11 | TC_LOY_NEG_CLAMP | hoàn tiền khi points=0 | BRONZE (không âm) | LOY-X1* |

11 TC; bao phủ toàn bộ 3 ngưỡng (mỗi ngưỡng đủ `-1 / = / +1`).

---

## Câu 4. Triển khai kiểm thử tự động

### 4.1. Tầng nghiệp vụ — JUnit 5 + Mockito (đã có sẵn)
File có sẵn: `backend/src/test/java/com/doctorbooking/backend/service/WalletServiceTest.java`

Các test BVA hiện có khớp trực tiếp:
- `loyaltyTier_bva_0_bronze` → LOY-B0
- `loyaltyTier_bva_999_bronze` → LOY-B1
- `loyaltyTier_bva_1000_silver` → LOY-B2
- `loyaltyTier_bva_1001_silver` → LOY-B3
- `loyaltyTier_bva_4999_silver` → LOY-B4
- `loyaltyTier_bva_5000_gold` → LOY-B5
- `loyaltyTier_bva_5001_gold` → LOY-B6
- `loyaltyTier_bva_9999_gold` → LOY-B7
- `loyaltyTier_bva_10000_platinum` → LOY-B8
- `loyaltyTier_bva_10001_platinum` → LOY-B9
- `refundAppointment_loyaltyPointsNotNegative` → LOY-X1*

> Đây là chức năng có độ bao phủ BVA **tốt nhất** dự án ở tầng JUnit — đã đủ.

### 4.2. Tầng UI E2E — CodeceptJS (Blackbox BVA)

File: `frontend/e2e/tests/blackbox/loyalty_tier_bva_test.cjs` (tag `@bva`)

| Scenario | Tag | Hạng UI |
|---|---|---|
| 999 điểm | LOY-B1 | Đồng |
| 1.000 điểm | LOY-B2 | Bạc |
| 5.000 điểm | LOY-B5 | Vàng |

Chạy: `cd frontend && npx codeceptjs run --grep @bva --grep LOY`

---

## Bảng truy vết tag → test

| Tag | Điểm | Test tự động |
|---|---:|---|
| LOY-B0 | 0 | `WalletServiceTest#loyaltyTier_bva_0_bronze` |
| LOY-B1 | 999 | `WalletServiceTest#loyaltyTier_bva_999_bronze` |
| LOY-B2 | 1000 | `WalletServiceTest#loyaltyTier_bva_1000_silver` |
| LOY-B3 | 1001 | `WalletServiceTest#loyaltyTier_bva_1001_silver` |
| LOY-B4 | 4999 | `WalletServiceTest#loyaltyTier_bva_4999_silver` |
| LOY-B5 | 5000 | `WalletServiceTest#loyaltyTier_bva_5000_gold` |
| LOY-B6 | 5001 | `WalletServiceTest#loyaltyTier_bva_5001_gold` |
| LOY-B7 | 9999 | `WalletServiceTest#loyaltyTier_bva_9999_gold` |
| LOY-B8 | 10000 | `WalletServiceTest#loyaltyTier_bva_10000_platinum` |
| LOY-B9 | 10001 | `WalletServiceTest#loyaltyTier_bva_10001_platinum` |
| LOY-X1* | clamp 0 | `WalletServiceTest#refundAppointment_loyaltyPointsNotNegative` |

---

## Ghi chú

Đây là minh hoạ kinh điển cho **BVA đa biên**: thay vì 1 khoảng `[min,max]`, miền điểm bị chia bởi 3 ngưỡng, mỗi ngưỡng cần test `-1 / = / +1`. Tổng 10 giá trị biên (+1 clamp) bao phủ toàn bộ ranh giới chuyển hạng.
