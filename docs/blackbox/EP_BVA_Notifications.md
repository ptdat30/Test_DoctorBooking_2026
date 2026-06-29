# Kiểm thử hộp đen chức năng Thông báo (Notifications)

> **Dự án:** Doctor Booking System 2026
> **Kỹ thuật:** Equivalence Partitioning (EP) — không có biên số học cổ điển
> **Đối tượng kiểm thử:** `GET /api/patient/notifications`, `GET /api/patient/notifications/unread-count`
> **Prefix tag:** `NOT`

---

## 0. Đặc tả

Notifications không có `@Min/@Max/@Size`. Kiểm thử tập trung vào **EP trạng thái**:

| Trạng thái | Mô tả |
|---|---|
| Danh sách rỗng | `notifications.length === 0` |
| Có thông báo | `notifications.length > 0` |
| Chưa đọc | `isRead === false` → badge count > 0 |
| Đã đọc hết | `unreadCount === 0` |

---

## Câu 1. Phân hoạch lớp tương đương (EP)

| Biến | Lớp hợp lệ | Tag | Lớp đặc biệt | Tag |
|---|---|---|---|---|
| `notifications` | có phần tử | **NOT-V1** | rỗng | **NOT-V2** |
| `unreadCount` | `> 0` | **NOT-V3** | `= 0` | **NOT-V4** |

---

## Câu 2. BVA

Không áp dụng BVA số học. Ranh giới `0/1` thông báo được xem là **EP discrete** (NOT-V1 vs NOT-V2).

---

## Câu 3. Test case

| STT | Mô tả | Kết quả UI | Tag |
|--:|---|---|---|
| 1 | 2 thông báo chưa đọc | Badge hiển thị `2` | NOT-V1, NOT-V3 |
| 2 | Danh sách rỗng | Text "Chưa có thông báo nào" | NOT-V2, NOT-V4 |

---

## Câu 4. Triển khai kiểm thử tự động

### 4.1. E2E CodeceptJS — `frontend/e2e/tests/blackbox/notifications_bva_test.cjs`

| Scenario | Tag |
|---|---|
| Mock empty → empty state | NOT-V2, NOT-V4 |
| Mock 2 unread → badge `2` | NOT-V1, NOT-V3 |

Page Object: `frontend/e2e/pages/NotificationPage.cjs`

Chạy: `cd frontend && npx codeceptjs run --grep @bva --grep notifications`

---

## Bảng truy vết tag → test

| Tag | Test E2E |
|---|---|
| NOT-V1, NOT-V3 | `notifications_bva_test.cjs` — unread badge |
| NOT-V2, NOT-V4 | `notifications_bva_test.cjs` — empty list |
