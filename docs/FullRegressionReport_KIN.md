# Full Regression Test Report - KIN

## Project Information

- Project: KIN Utility System
- Repository: https://github.com/anaclaireellen/IT342_G5_Naranjo_Lab1-
- Branch: vertical-slice-regression
- Date: May 10, 2026
- Platforms covered: Spring Boot backend, React web frontend, Android mobile application

## Refactoring Summary

The project was refactored from technical-layer organization into vertical feature slices while preserving existing behavior. Backend authentication classes now live together in the `features.auth` package. Web screens and supporting utilities are grouped by feature: auth, dashboard, borrowing, messaging, profile, and shared infrastructure. Android activities were moved into auth, dashboard, and admin feature packages, while Retrofit API classes were moved into a core network package.

Regression fixes applied during the refactor:

- Updated Android registration endpoint from `/api/register` to `/api/auth/register`.
- Updated Android registration payload to send `firstName` and `lastName`, matching backend registration validation.
- Updated Android manifest activity names after package refactoring.
- Aligned AndroidX Core KTX to `1.12.0` so the mobile build remains compatible with compile SDK 34 and Android Gradle Plugin 8.3.2.
- Added `clearStoredSession()` removal of `isAuth` so logout fully clears authentication state.
- Added H2 test database configuration for backend regression tests.

## Updated Project Structure

```text
backend/src/main/java/com/example/kin
  config/
  features/auth/
    AuthController.java
    User.java
    UserRepository.java

web/src
  features/auth/
  features/borrowing/
  features/dashboard/
  features/messaging/
  features/profile/
  shared/components/
  shared/lib/
  shared/theme.js

mobile/app/src/main/java/com/example/kin
  core/network/
  features/admin/
  features/auth/
  features/dashboard/
```

## Functional Requirements Coverage

| Requirement | Backend | Web | Mobile | Automated Coverage |
|---|---:|---:|---:|---|
| Register student/admin accounts | Yes | Yes | Yes | Backend auth test, mobile build |
| Generate CIT username/email from names | Yes | Yes | Partial preview on mobile via full-name split | Backend auth test |
| Login with generated email/username | Yes | Yes | Yes | Backend auth test |
| Persist and clear authenticated session | N/A | Yes | Yes | Web profile helper test |
| View dashboard by role | N/A | Yes | Yes | Web build, mobile build |
| Post BorrowHub requests | External Supabase | Yes | N/A | Web build |
| Browse and respond to requests | External Supabase | Yes | N/A | Web build |
| Direct messages and deal confirmations | External Supabase | Yes | N/A | Web deal-message tests |
| Profile settings and avatar persistence | Yes | Yes | N/A | Web profile helper test |
| Admin panel access | N/A | Yes | Yes | Web build, mobile build |

## Test Plan

| ID | Feature | Test Steps / Script | Expected Result | Automation |
|---|---|---|---|---|
| TC-001 | Backend context | Run `mvn test` in `backend` | Spring context loads with H2 test DB | `KinApplicationTests` |
| TC-002 | Registration | POST `/api/auth/register` with first name, last name, password, role | User is saved with generated unique username and `@cit.edu` email | `AuthControllerTest.registerGeneratesUniqueUsernameAndCitEmail` |
| TC-003 | Login | POST `/api/auth/login` with generated email and password | Login response returns username, role, email, and profile fields | `AuthControllerTest.loginAcceptsGeneratedEmailIdentifier` |
| TC-004 | Profile lookup | GET `/api/auth/profiles?usernames=...` | Profile summary list is returned | `AuthControllerTest.profilesReturnsRequestedProfileSummaries` |
| TC-005 | Web routing | Run `npm test -- --watchAll=false --runInBand` | Landing route renders after feature-slice imports | `App.test.js` |
| TC-006 | Web profile session | Persist and clear profile in localStorage | Profile cache is readable and auth state is cleared | `profileHelpers.test.js` |
| TC-007 | Deal messages | Create, parse, preview, and key deal messages | Deal metadata remains stable | `dealMessages.test.js` |
| TC-008 | Web production build | Run `npm run build` in `web` | React app compiles successfully | Build command |
| TC-009 | Mobile unit/build regression | Run `gradlew testDebugUnitTest assembleDebug` with Android SDK env vars | Unit tests pass and debug APK assembles | Gradle command |

## Automated Test Evidence

| Command | Result |
|---|---|
| `mvn test` | Passed: 4 tests, 0 failures, 0 errors |
| `npm test -- --watchAll=false --runInBand` | Passed: 3 suites, 5 tests |
| `npm run build` | Passed: production build compiled successfully |
| `gradlew testDebugUnitTest assembleDebug` | Passed: 38 Gradle tasks, debug APK assembled |

Generated evidence locations:

- Backend Surefire reports: `backend/target/surefire-reports/`
- Web production build: `web/build/`
- Mobile unit test report: `mobile/app/build/reports/tests/testDebugUnitTest/`
- Mobile debug APK: `mobile/app/build/outputs/apk/debug/`

## Regression Test Results

| Area | Status | Notes |
|---|---|---|
| Backend API | Passed | Auth controller and Spring context tests pass. |
| Web frontend | Passed | Jest tests and production build pass after vertical-slice import updates. |
| Mobile app | Passed | Unit tests and debug assembly pass after SDK env setup and AndroidX version alignment. |
| External services | Not executed end-to-end | Supabase-backed BorrowHub and messaging require live Supabase data and credentials; covered by build and utility tests only. |

## Issues Found

| Issue | Impact | Fix Applied |
|---|---|---|
| Android client posted registration to `/api/register` | Mobile registration could not reach current backend endpoint | Changed Retrofit route to `/api/auth/register` |
| Android registration payload used `username` instead of required first/family names | Backend validation rejected mobile registration | Split full name into `firstName` and `lastName` payload fields |
| Android package moves broke manifest references | App launch/navigation would fail | Updated manifest and imports to feature packages |
| AndroidX Core KTX 1.16.0 incompatible with AGP 8.3.2/compile SDK 34 | Mobile build failed before compilation | Downgraded Core KTX to 1.12.0 |
| Web logout helper left `isAuth` in storage | Local session could remain marked authenticated | Removed `isAuth` in `clearStoredSession()` |
| Backend tests depended on local MySQL | Regression tests were environment-sensitive | Added H2 test database configuration |

## Fixes Applied

All identified regressions from the refactor and test runs were fixed. Final automated regression status is passing for backend, web, and mobile build/unit coverage.
