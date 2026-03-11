# E2E Apply Workflow Test Plan

## 1. Purpose

The purpose of this Test Plan is to define the testing strategy, scope, roles, environments, schedule, preconditions, and deliverables for validating the Apply Workflow within Simpler Grants.
This ensures that Organization and Individual users can successfully start an application, complete required and conditionally required forms, upload documents, review, and submit a grant application without errors.

## 2. Preconditions

Before executing Apply workflow tests, the following must be satisfied:

- The user is able to login successfully with all required roles to create an application.
- The user can access Search funding opportunities page.
- The user can search for and select a specific Funding Opportunity.
- Required test data (organization or individual profiles, documents) is available.
- The system is available and stable.

## 3. Scope

### 3.1. In Scope

This Test Plan covers functional and non\*functional aspects of the Apply Workflow:

- Start a new application for Organization and Individual users
- Save and update application data
- Required and conditionally required form validations
- Optional form selection for submission
- Document upload via forms and Attachments section
- Review application
- Submission flow and confirmation page
- e2e workflows in a real environment
- Mobile browser checks

### 3.2. Out of Scope

- Post-submission editing
- Reviewer/Admin workflows
- Deep search or dashboard functionality
- Email notifications
- Upload file size validations, format validations and virus checks
- i18n translations, accessibility, or API validation

## 4. Test Objectives

- Confirm users can complete the Apply workflow e2e for Organization and Individual users.
- Ensure all required and conditionally required validations work correctly.
- Verify optional form selection works as expected.
- Confirm documents upload correctly.
- Ensure UI components behave consistently across workflow states.
- Validate submission confirmation page loads with expected content.

## 5. Test Approach

Testing is divided into the following levels:

### 5.1. e2e Tests (Playwright)

- Validates full user experience: Start → Fill → Upload → Review → Submit
- Includes negative/edge case handling, network errors, browser compatibility checks
- Location:
  - frontend/tests/e2e/apply/e2e-apply-workflow.specs.ts
  - frontend/tests/e2e/apply/negative-cases.specs.ts
  - frontend/tests/e2e/apply/edge-cases.specs.ts

## 6. Test Environment

- Staging - QA verification in a production-like environment - Full Playwright e2e tests covering happy path, negative and edge cases, optional forms, attachment uploads, and submission confirmation
  - URL:- https://staging.simpler.grants.gov/
- Production - Happy Path E2E Check to ensure submission works and confirmation page displays correctly
  - URL:- https://simpler.grants.gov/

## 7. Entry & Exit Criteria

Entry Criteria:

- User workflows and preconditions defined
- Acceptance criteria approved
- Test environment stable
  Exit Criteria:
- All test cases executed
- No blockers or high severity defects open
- E2E happy path workflow passes reliably

## 8. Risks

### API instability

The backend APIs that the Apply workflow depends on may be slow, unreliable, or return errors. This can cause tests to fail or the application to behave unpredictably during submission, form saving, or document uploads.

### Large file uploads

Users may attempt to upload files at or near the maximum allowed size. This can reveal performance issues, timeouts, or unexpected errors in the document upload process.

### Browser inconsistencies

The Apply workflow may behave differently across browsers (Chrome, Firefox, Edge, Safari, Mobile browsers) due to rendering, JavaScript execution, or CSS differences. This can lead to UI misalignment, broken functionality, or inconsistent user experience.

### Multi-step form state loss

The workflow involves multiple steps and forms. There’s a risk that form data could be lost if the user navigates away or a network request fails. This can disrupt the user experience and lead to submission errors.

## 9. Traceability Table

| Workflow Step                         | Test Type | Location (Exact Path)                                                                                                                                          | Notes                                                                                                 |
| ------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| User login with necessary roles       | E2E       | `frontend/tests/e2e/apply/e2e-apply-workflow.specs.ts`<br>`frontend/tests/e2e/apply/negative-cases.specs.ts`                                                   | Happy: successful login<br>Negative: missing roles                                                    |
| Search and select Funding Opportunity | E2E       | `frontend/tests/e2e/apply/e2e-apply-workflow.specs.ts`                                                                                                         | Happy: valid opportunity                                                                              |
| Start application (Org & Individual)  | E2E       | `frontend/tests/e2e/apply/e2e-apply-workflow.specs.ts`<br>`frontend/tests/e2e/apply/negative-cases.specs.ts`<br>`frontend/tests/e2e/apply/edge-cases.specs.ts` | Edge: multiple applications in succession<br>Negative: missing dropdown selection due to invalid role |
| Fill required forms                   | E2E       | `frontend/tests/e2e/apply/e2e-apply-workflow.specs.ts`<br>`frontend/tests/e2e/apply/negative-cases.specs.ts`<br>`frontend/tests/e2e/apply/edge-cases.specs.ts` | Edge: max field length, boundary dates<br>Negative: required fields blank, invalid input              |
| Fill conditionally required forms     | E2E       | `frontend/tests/e2e/apply/e2e-apply-workflow.specs.ts`<br>`frontend/tests/e2e/apply/negative-cases.specs.ts`<br>`frontend/tests/e2e/apply/edge-cases.specs.ts` | Edge: minimal conditional input<br>Negative: skip required conditional form                           |
| Optional form selection               | E2E       | `frontend/tests/e2e/apply/e2e-apply-workflow.specs.ts`<br>`frontend/tests/e2e/apply/negative-cases.specs.ts`<br>`frontend/tests/e2e/apply/edge-cases.specs.ts` | Edge: select all optional forms<br>Negative: incorrect or skipped optional form                       |
| Upload documents                      | E2E       | `frontend/tests/e2e/apply/e2e-apply-workflow.specs.ts`<br>`frontend/tests/e2e/apply/negative-cases.specs.ts`<br>`frontend/tests/e2e/apply/edge-cases.specs.ts` | Edge: max-size valid file<br>Negative: unsupported type, oversized file                               |
| Review Application                    | E2E       | `frontend/tests/e2e/apply/e2e-apply-workflow.specs.ts`<br>`frontend/tests/e2e/apply/negative-cases.specs.ts`<br>`frontend/tests/e2e/apply/edge-cases.specs.ts` | Edge: multiple revisions<br>Negative: incomplete or invalid data                                      |
| Submission                            | E2E       | `frontend/tests/e2e/apply/e2e-apply-workflow.specs.ts`<br>`frontend/tests/e2e/apply/negative-cases.specs.ts`<br>`frontend/tests/e2e/apply/edge-cases.specs.ts` | Edge: simultaneous submissions<br>Negative: API failure, incomplete workflow                          |

## 10. Approval

| Name | Date | Signature |
| ---- | ---- | --------- |
|      |      |           |
