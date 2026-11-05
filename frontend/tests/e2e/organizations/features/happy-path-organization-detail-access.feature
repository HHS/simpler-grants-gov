# @featureArea Authentication
# @specFile e2e/organizations/specs/organization-detail-access.spec.ts
# @debugNote POC for multi-user auth. Logs in as the org-member test user via
#   the endpoint-based spoof and confirms per-user auth works by viewing that
#   user's organization detail page (the primary test user is not a member of
#   this organization).
#   Expected auth behavior: the detail page's AuthorizationGate only shows its
#   unauthorized message when a resource fetch 403s, not when the
#   manage_org_members privilege check fails. A member can fetch org details, so
#   the page renders for them; only a non-member (whose detail fetch 403s) sees
#   the unauthorized message.

Feature: Organization detail page access
  As a member of an organization
  I want to view my organization's detail page
  So that I can see my organization's information and roster

  Background:
    Given the user is logged in as the org-member test user

  Scenario: Org member can view their organization's detail page
    When the user navigates to their organization's detail page
    Then the organization name is shown as the page heading
    And the organization roster section is visible
    And no unauthorized message is shown

  # TODO: add a scenario for a non-member navigating to an organization they do
  # not belong to, asserting the unauthorized message (the detail fetch 403s).
