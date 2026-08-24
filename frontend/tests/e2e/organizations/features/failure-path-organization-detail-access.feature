# @featureArea Authentication
# @specFile e2e/organizations/specs/failure-path-organization-detail-access.spec.ts
# @debugNote Failure-path tests for organization detail page access. Covers non-org users and unauthenticated access. A non-org user should trigger a detail fetch 403 and render the unauthorized message.

Feature: Organization detail page access - failure path
  As a user who is not authorized for an organization
  I want to be blocked from viewing that organization's detail page
  So that unauthorized access is prevented

  Scenario: Non-org user cannot access another organization's detail page
    Given the user is logged in as the primary org admin test user
    When the user navigates to another organization's detail page
    Then the unauthorized message is shown
    And the organization detail content is not visible

  Scenario: Non-org user still cannot access another organization's detail page after reload
    Given the user is logged in as the primary org admin test user
    When the user navigates to another organization's detail page
    And the user refreshes the page
    Then the unauthorized message is still shown
    And the organization detail content is still not visible

  Scenario: Unauthenticated user cannot access another organization's detail page
    Given the user is not authenticated
    When the user navigates to another organization's detail page directly
    Then the unauthenticated message is shown
    And the sign-in CTA is shown
