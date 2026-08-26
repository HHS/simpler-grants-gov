# @featureArea Authentication
# @specFile e2e/organizations/specs/failure-path-organization-detail-access.spec.ts
# @debugNote Failure-path tests for organization detail page access. Covers a signed-in org admin from another organization receiving a 403 and seeing the Unauthorized message, and a signed-out user seeing the not-signed-in flow

Feature: Organization detail page access - failure path
  As a user who is not authorized for an organization
  I want to be blocked from viewing that organization's detail page
  So that unauthorized access is prevented

  Scenario: Org admin from another organization cannot access the organization detail page
    Given the user is logged in as an org admin for a different organization
    When the user navigates to another organization's detail page
    Then the unauthorized message is shown
    And the organization detail content is not visible

  Scenario: Org admin from another organization still cannot access the organization detail page after reload
    Given the user is logged in as an org admin for a different organization
    When the user navigates to another organization's detail page
    And the user refreshes the page
    Then the unauthorized message is still shown
    And the organization detail content is still not visible

  Scenario: Signed-out user cannot access an organization's detail page
    Given the user is signed out
    When the user navigates directly to an organization's detail page
    Then the unauthenticated message is shown
    And the sign-in CTA is shown
