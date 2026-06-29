# White-box Testing Report

## Phạm vi

- **Công cụ:** JUnit 5, Mockito, JaCoCo Maven Plugin
- **Phạm vi đo:** `controller/` + `service/` (loại trừ infrastructure và side-effect services)
- **Tickets:** SCRUM-209 → SCRUM-212

## Tài liệu trong thư mục này

| File | Mô tả |
|------|-------|
| [`coverage-summary.md`](./coverage-summary.md) | Tổng hợp % line/branch theo class |
| [`diagrams/testing-diagrams.md`](./diagrams/testing-diagrams.md) | **6 diagram Mermaid** (Test Pyramid, CFG, Short-circuit, State, BVA, Traceability) |
| [`jacoco/jacoco.csv`](./jacoco/jacoco.csv) | Snapshot số liệu JaCoCo |
| [`jacoco/index.html`](./jacoco/index.html) | Báo cáo HTML (mở bằng trình duyệt) |
| [`diagrams/`](./diagrams/) | CFG, short-circuit, AuthService flow (PNG) |

## Test files (trong source code)

```
backend/src/test/java/com/doctorbooking/backend/
├── controller/          # SCRUM-210 — 9 controller test classes
├── service/               # SCRUM-211, SCRUM-212
│   ├── AppointmentServiceTest.java
│   ├── AppointmentServiceExtraTest.java   # SCRUM-212
│   ├── AdminServiceTest.java
│   ├── NotificationServiceTest.java
│   ├── MedicationServiceTest.java
│   ├── FamilyMemberServiceTest.java
│   ├── VNPayServiceTest.java
│   └── AISymptomServiceTest.java          # fallback path only
└── dto/                   # Bean Validation BVA
    ├── RegisterRequestValidationTest.java
    ├── LoginRequestValidationTest.java
    ├── FeedbackRequestValidationTest.java
    ├── TopUpRequestValidationTest.java
    └── SymptomCheckRequestValidationTest.java
```

## Commits liên quan

| Commit | Ticket | Nội dung |
|--------|--------|----------|
| `f8db3c9` | SCRUM-209 | JaCoCo gate + excludes |
| `44dd87a` | SCRUM-210 | Controller unit tests |
| `10c8190` | SCRUM-211 | Service unit tests batch 1 |
| `fd6bbf5` | SCRUM-212 | AppointmentService branch coverage |
