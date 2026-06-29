# CI Pipeline Summary

> Source: `.github/workflows/ci.yml` — nhánh `staging` / `main`

## Jobs chính

| Job | Trigger | Nội dung |
|-----|---------|----------|
| **Detect Changes** | Mọi push/PR | Path filter: backend / frontend / postman |
| **Backend: Build, Test & Coverage** | Có thay đổi backend | `mvnw clean verify` + MySQL 8.0 + JaCoCo gate |
| **Frontend: Build** | Có thay đổi frontend | `npm ci && npm run build` |
| **SonarCloud: Scan & Quality Gate** | Backend changed | Static analysis + quality gate |
| **Newman API Tests** | Postman changed | Postman collection qua Newman |
| **E2E Tests** | Frontend changed | CodeceptJS (khi cấu hình) |

## Backend test pipeline

```
checkout → JDK 21 → MySQL service → mvnw clean verify
    ├── JUnit 5 unit tests (~240 tests)
    ├── JaCoCo report (line ≥80%, branch ≥70%)
    └── Upload artifacts: surefire-reports, jacoco HTML
```

## Artifacts upload (GitHub Actions)

| Artifact | Path | Retention |
|----------|------|-----------|
| `backend-test-results` | `backend/target/surefire-reports/` | 7 ngày |
| `backend-build-artifacts` | JAR + `target/site/jacoco/` | 1 ngày |

## Mutation testing

Workflow riêng: `.github/workflows/mutation-testing.yml` (PiTest) — chạy theo lịch / manual.

## Chứng cứ cho giảng viên

1. Mở tab **Actions** trên GitHub repo
2. Chọn workflow run mới nhất trên nhánh `staging`
3. Kiểm tra job **Backend: Build, Test & Coverage** — status green
4. Download artifact `backend-build-artifacts` để xem JaCoCo HTML đầy đủ

## Commits white-box đã push

| Commit | Ticket |
|--------|--------|
| `f8db3c9` | SCRUM-209 |
| `44dd87a` | SCRUM-210 |
| `10c8190` | SCRUM-211 |
| `fd6bbf5` | SCRUM-212 |
