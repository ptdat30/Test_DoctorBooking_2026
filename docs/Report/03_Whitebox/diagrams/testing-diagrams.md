# Testing Diagrams (Mermaid)

> Doctor Booking System 2026 — dùng cho báo cáo `docs/Report/`
>
> Mở file này trong VS Code / GitHub / Cursor để preview Mermaid, hoặc export PNG tại [mermaid.live](https://mermaid.live).
>
> Khi dùng Mermaid Live Editor, chỉ copy phần **bên trong** khối code, bắt đầu từ `flowchart`, `stateDiagram-v2`, ... Không copy dòng ```mermaid và ``` vì sẽ gây `UnknownDiagramError`.

---

## 1. Test Layers / Test Pyramid

```mermaid
flowchart TB
    subgraph UI["Tầng 4 — E2E / UI"]
        E2E["CodeceptJS + Playwright<br/>@smoke + @bva<br/>Patient / Doctor / Admin / Public"]
    end

    subgraph API["Tầng 3 — Integration / API"]
        NEWMAN["Postman + Newman<br/>REST + MySQL<br/>JSON Schema validation"]
        INT["Integration flows<br/>family_booking, multi_role"]
    end

    subgraph UNIT["Tầng 2 — White-box Unit"]
        JUNIT["JUnit 5 + Mockito<br/>Controller + Service"]
        JACOCO["JaCoCo coverage gate<br/>Line ≥ 80% · Branch ≥ 70%"]
        DTO["Bean Validation BVA<br/>RegisterRequest, TopUpRequest, …"]
    end

    subgraph DOC["Tầng 1 — Blackbox Design"]
        BVA["EP / BVA documents<br/>docs/Report/02_Blackbox/"]
        EXCEL["Integration Test Report<br/>DB_Integration_Test.xlsx"]
    end

    subgraph INFRA["Hạ tầng chứng cứ"]
        CI["GitHub Actions CI<br/>.github/workflows/ci.yml"]
        DB[(MySQL 8.0)]
    end

    DOC --> UNIT
    UNIT --> API
    API --> UI
    UNIT --> JACOCO
    API --> DB
    UNIT --> DB
    CI --> UNIT
    CI --> API
    CI --> UI
    EXCEL -.->|"báo cáo tổng hợp"| DOC

    style UI fill:#dbeafe,stroke:#2563eb
    style API fill:#dcfce7,stroke:#16a34a
    style UNIT fill:#fef9c3,stroke:#ca8a04
    style DOC fill:#f3e8ff,stroke:#9333ea
    style INFRA fill:#f1f5f9,stroke:#64748b
```



---



## 2. CFG — `AuthService.register()`

Control Flow Graph cho method white-box chính (đăng ký tài khoản).

```mermaid
flowchart TD
    START([START<br/>register request]) --> N1{username<br/>đã tồn tại?}
    N1 -->|Yes| E1[/throw: Username already exists/]
    N1 -->|No| N2{email<br/>đã tồn tại?}
    N2 -->|Yes| E2[/throw: Email already exists/]
    N2 -->|No| N3[Tạo User entity<br/>set username, password, email]
    N3 --> N4{role != null<br/>AND not empty?}
    N4 -->|Yes| N5{Role.valueOf<br/>hợp lệ?}
    N4 -->|No| N6[role = PATIENT default]
    N5 -->|Yes| N7[gán role từ request]
    N5 -->|No| N6
    N6 --> N8[user.setEnabled true]
    N7 --> N8
    N8 --> N9[save User]
    N9 --> N10{switch role}
    N10 -->|PATIENT| N11[save Patient]
    N10 -->|DOCTOR| N12[save Doctor]
    N10 -->|ADMIN| N13[save Admin]
    N11 --> N14[generate JWT + refreshToken]
    N12 --> N14
    N13 --> N14
    N14 --> N15[build AuthResponse]
    N15 --> END([RETURN AuthResponse])

    E1 --> STOP([END])
    E2 --> STOP

    classDef decision fill:#fef3c7,stroke:#d97706
    classDef process fill:#e0f2fe,stroke:#0284c7
    classDef terminal fill:#fee2e2,stroke:#dc2626
    classDef success fill:#dcfce7,stroke:#16a34a

    class N1,N2,N4,N5,N10 decision
    class N3,N6,N7,N8,N9,N11,N12,N13,N14,N15 process
    class E1,E2,STOP terminal
    class START,END success
```



**Path coverage tiêu biểu:**


| Path | Mô tả                           | Test                                 |
| ---- | ------------------------------- | ------------------------------------ |
| P1   | username trùng                  | `AuthServiceTest` / Postman negative |
| P2   | email trùng                     | `AuthServiceTest` / Postman negative |
| P3   | role hợp lệ → PATIENT           | `AuthServiceTest.register_success`   |
| P4   | role invalid → fallback PATIENT | `AuthServiceTest`                    |
| P5   | role DOCTOR / ADMIN             | service branch tests                 |


---



## 3. Short-circuit — điều kiện phức tạp



### 3a. Slot đã bị book — `createAppointment()` line 143–148

```mermaid
flowchart TD
    A["Bắt đầu đánh giá slotTaken<br/>anyMatch trên existingAppointments"] --> B{"Điều kiện 1:<br/>apt.time == request.time ?"}
    B -->|false| SKIP["Bỏ qua appointment này<br/>→ kiểm tra apt tiếp theo"]
    B -->|true| C{"Điều kiện 2:<br/>status == PENDING<br/>OR status == CONFIRMED ?"}
    C -->|false| SKIP
    C -->|true| TAKEN["slotTaken = true<br/>→ throw slot already taken"]

  SKIP --> NEXT{ Còn appointment? }
  NEXT -->|Yes| B
  NEXT -->|No| FREE["Slot available → tiếp tục booking"]

    style B fill:#fef3c7,stroke:#d97706
    style C fill:#fef3c7,stroke:#d97706
    style TAKEN fill:#fee2e2,stroke:#dc2626
    style FREE fill:#dcfce7,stroke:#16a34a
```



**Short-circuit** `&&`**:** Nếu `apt.time != request.time` → **không** đánh giá `status` (điều kiện 2 bị bỏ qua).

### 3b. Hoàn tiền WALLET — `processRefundIfNeeded()` / `cancelAppointment()`

```mermaid
flowchart TD
    R["Bắt đầu refund check"] --> W{"paymentMethod<br/>== WALLET ?"}
    W -->|false| NO["Không refund"]
    W -->|true| P{"paymentStatus<br/>== PAID ?"}
    P -->|false| NO
    P -->|true| PR{"price != null<br/>AND price > 0 ?"}
    PR -->|false| NO
    PR -->|true| RF["walletService.refundAppointment()<br/>paymentStatus = REFUNDED"]

    style W fill:#fef3c7,stroke:#d97706
    style P fill:#fef3c7,stroke:#d97706
    style PR fill:#fef3c7,stroke:#d97706
    style RF fill:#dcfce7,stroke:#16a34a
    style NO fill:#f1f5f9,stroke:#64748b
```



**Test evidence:** `AppointmentServiceExtraTest.cancelByDoctor_walletRefund`, `cancelAppointment_wallet_refund`

---



## 4. State Transition — Appointment Lifecycle

```mermaid
stateDiagram-v2
    [*] --> PENDING : createAppointment()\npatient đặt lịch

    PENDING --> CONFIRMED : confirmAppointment()\ndoctor / admin xác nhận
    PENDING --> CANCELLED : cancelAppointment()\ncancelByDoctor() / cancelByAdmin()\ncancelDueToPaymentFailure()

    CONFIRMED --> COMPLETED : completeAppointment()\nsau khi tạo treatment
    CONFIRMED --> CANCELLED : cancelAppointment()\ncancelByDoctor() / cancelByAdmin()

    COMPLETED --> [*]
    CANCELLED --> [*]

    note right of PENDING
        Payment: PENDING / PAID / UNPAID
        Có thể thanh toán WALLET ngay khi tạo
    end note

    note right of CONFIRMED
        cancelByDoctor: phải còn ≥ 24h
        cancelByAdmin: không giới hạn thời gian
    end note

    note right of CANCELLED
        WALLET + PAID → REFUNDED
        Ghi cancellationReason
    end note
```



**Payment status (song song):**

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAY : CASH / VNPAY booking
    [*] --> PAID : WALLET paid / free consultation
    PENDING_PAY --> PAID : VNPAY callback success\nupdatePaymentStatus()
    PENDING_PAY --> UNPAID : payment failure\ncancelDueToPaymentFailure()
    PAID --> REFUNDED : cancel + WALLET refund
    UNPAID --> [*]
    REFUNDED --> [*]
    PAID --> [*]
```



---



## 5. BVA Boundary — Register (`username` + `password`)

```mermaid
flowchart LR
    subgraph X_LOW["❌ Invalid — quá ngắn"]
        B0["B0: len=2<br/>username"]
        X4["X4: len=5<br/>password"]
    end

    subgraph VALID["✅ Valid region"]
        B1["B1: len=3<br/>min"]
        B2["B2: len=4"]
        B3["B3: len=26<br/>nominal"]
        B4["B4: len=49"]
        B5["B5: len=50<br/>max"]
        P6["B7: len=6<br/>password min"]
    end

    subgraph X_HIGH["❌ Invalid — quá dài / blank"]
        B6["B6: len=51<br/>username"]
        X3["X3: blank username"]
        X5["X5: blank password"]
    end

    B0 -->|"REG-B0"| X_LOW
    B1 -->|"REG-B1"| VALID
    B5 -->|"REG-B5"| VALID
    B6 -->|"REG-B6"| X_HIGH
    P6 -->|"REG-B7"| VALID
    X4 --> X_LOW

    style VALID fill:#dcfce7,stroke:#16a34a
    style X_LOW fill:#fee2e2,stroke:#dc2626
    style X_HIGH fill:#fee2e2,stroke:#dc2626
```





### BVA bổ sung — Wallet Top-up `amount ≥ 10,000 VNĐ`

```mermaid
flowchart LR
    subgraph INVALID["❌ amount < 10,000"]
        WAL_B0["WAL-B0: 9,999"]
        WAL_B4["WAL-B4: 100"]
        WAL_X2["null"]
    end

    subgraph VALID_W["✅ amount ≥ 10,000"]
        WAL_B1["WAL-B1: 10,000 min"]
        WAL_B2["WAL-B2: 10,001"]
        WAL_B3["WAL-B3: 50,000"]
    end

    WAL_B0 --> INVALID
    WAL_B1 --> VALID_W
    WAL_B3 --> VALID_W

    style VALID_W fill:#dcfce7,stroke:#16a34a
    style INVALID fill:#fee2e2,stroke:#dc2626
```



**Evidence:** `RegisterRequestValidationTest`, `TopUpRequestValidationTest`, `register_bva_test.cjs`, `wallet_bva_test.cjs`

---



## 6. Traceability — Ticket → Test → Evidence

```mermaid
flowchart TB
    subgraph BLACKBOX["Blackbox SCRUM-195 → 208"]
        T195["SCRUM-195 Register"]
        T196["SCRUM-196 Login"]
        T197["SCRUM-197 Booking"]
        T200["SCRUM-200 Wallet"]
        T205["SCRUM-205 E2E Patient"]
    end

    subgraph WHITEBOX["White-box SCRUM-209 → 212"]
        T209["SCRUM-209 JaCoCo gate"]
        T210["SCRUM-210 Controllers"]
        T211["SCRUM-211 Services"]
        T212["SCRUM-212 AppointmentService"]
    end

    subgraph DOCS["Tài liệu"]
        D_REG["EP_BVA_Register.md"]
        D_APT["EP_BVA_Appointment_Booking.md"]
        D_WAL["EP_BVA_Wallet_TopUp.md"]
        D_COV["coverage-summary.md"]
        D_XLS["DB_Integration_Test.xlsx"]
    end

    subgraph AUTO["Test tự động"]
        J_REG["RegisterRequestValidationTest"]
        J_APT["AppointmentServiceTest<br/>AppointmentServiceExtraTest"]
        J_CTRL["AuthControllerTest<br/>PatientControllerTest<br/>…"]
        P_AUTH["Postman 02_Auth"]
        P_APT["Postman 05_Appointments"]
        E_REG["register_bva_test.cjs"]
        E_APT["booking_bva_test.cjs"]
        E_WAL["wallet_bva_test.cjs"]
        E_SMOKE["patient/* smoke tests"]
    end

    subgraph PROOF["Chứng cứ"]
        C1["commit docs + e2e"]
        C2["f8db3c9 pom.xml"]
        C3["44dd87a controller tests"]
        C4["fd6bbf5 AppointmentService"]
        CI_RUN["GitHub Actions CI green"]
        JACOCO["jacoco/index.html"]
    end

    T195 --> D_REG --> J_REG & P_AUTH & E_REG
    T196 --> J_REG & P_AUTH & E_REG
    T197 --> D_APT --> J_APT & P_APT & E_APT
    T200 --> D_WAL --> E_WAL
    T205 --> E_SMOKE

    T209 --> D_COV --> C2 --> JACOCO
    T210 --> J_CTRL --> C3
    T211 --> J_APT
    T212 --> J_APT --> C4

    D_XLS -.-> BLACKBOX & WHITEBOX
    BLACKBOX & WHITEBOX --> CI_RUN

    style BLACKBOX fill:#f3e8ff,stroke:#9333ea
    style WHITEBOX fill:#fef9c3,stroke:#ca8a04
    style DOCS fill:#e0f2fe,stroke:#0284c7
    style AUTO fill:#dcfce7,stroke:#16a34a
    style PROOF fill:#f1f5f9,stroke:#64748b
```





### Ma trận rút gọn


| Ticket    | Document                        | JUnit                           | Postman           | E2E                     | Commit     |
| --------- | ------------------------------- | ------------------------------- | ----------------- | ----------------------- | ---------- |
| SCRUM-195 | `EP_BVA_Register.md`            | `RegisterRequestValidationTest` | `02_Auth`         | `register_bva_test.cjs` | docs batch |
| SCRUM-197 | `EP_BVA_Appointment_Booking.md` | `AppointmentServiceTest`        | `05_Appointments` | `booking_bva_test.cjs`  | —          |
| SCRUM-200 | `EP_BVA_Wallet_TopUp.md`        | `TopUpRequestValidationTest`    | `09_Wallet`       | `wallet_bva_test.cjs`   | —          |
| SCRUM-209 | `coverage-summary.md`           | —                               | —                 | —                       | `f8db3c9`  |
| SCRUM-210 | —                               | `*ControllerTest` (9 files)     | —                 | —                       | `44dd87a`  |
| SCRUM-212 | —                               | `AppointmentServiceExtraTest`   | —                 | —                       | `fd6bbf5`  |


