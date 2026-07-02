# MLVPYC Backend

Spring Boot 3 + Java 17 + PostgreSQL backend for the youth club savings/loan tracker.

## Setup

1. Install PostgreSQL locally (or use a free-tier host like Supabase/Neon/Render).
2. Create the database:
   ```sql
   CREATE DATABASE mlvpyc;
   CREATE USER mlvpyc_user WITH PASSWORD 'change_me';
   GRANT ALL PRIVILEGES ON DATABASE mlvpyc TO mlvpyc_user;
   ```
3. Update `src/main/resources/application.yml` with your real DB credentials.
4. Run:
   ```bash
   mvn spring-boot:run
   ```
   Tables are auto-created on first run (`ddl-auto: update`).

## What's implemented

- Member, Term, Contribution, Loan, LoanRepayment, AuditLog entities
- Priority scoring service (`PriorityService`) — the core fairness algorithm
- Loan application with hard-rule eligibility checks and clean fallback JSON errors
- Pool availability calculation per term
- Priority queue endpoint for admins to see who should be approved first
- Full REST API (see `docs/ARCHITECTURE.md` for the endpoint list)

## Not yet implemented (next steps)

- JWT authentication (`SecurityConfig` is currently open — see the note in that file)
- Per-installment repayment tracking (currently simplified to full-repayment-only)
- Scheduled job to auto-mark late contributions/repayments
- Admin role restriction on approve/reject endpoints

## Testing the API quickly

```bash
# Create a member
curl -X POST localhost:8080/api/members -H "Content-Type: application/json" \
  -d '{"name":"Ravi","phone":"9999999999"}'

# Create a term
curl -X POST localhost:8080/api/terms -H "Content-Type: application/json" \
  -d '{"termName":"Feb-Aug 2026","startDate":"2026-02-01","endDate":"2026-08-01","monthlyContribution":500}'

# Apply for a loan
curl -X POST localhost:8080/api/loans/apply -H "Content-Type: application/json" \
  -d '{"memberId":1,"termId":1,"amount":50000}'
```
