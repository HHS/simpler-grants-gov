Feature: Opportunity List Page - Failure Path
  As a grantor user
  I want the grantor opportunities list page to handle missing or unauthorized access properly
  So that unauthenticated and unauthorized users are blocked from viewing opportunities

  @AUTH @CORE_REGRESSION
  Scenario: Unauthenticated access to the Grantor opportunities list page
    # This covers the case where the user is not logged in at all.
    Given I am not authenticated
    When I navigate directly to "/grantor/opportunities"
    Then I should see "Not signed in"
    And I should see "Sign in first in order to view this page"

  @AUTH @CORE_REGRESSION
  Scenario: Authenticated user without agency access sees the unauthorized agency state for a valid agency they do not belong to
    # This covers a valid agency lookup where the authenticated user lacks access.
    Given I am authenticated as an org member test user
    When I navigate directly to "/grantor/opportunities?agency=38c85104-1136-4b86-a440-ad99ab612d3b"
    Then I should see "You do not have access to this agency's opportunities."

  @AUTH @CORE_REGRESSION
  Scenario: Authenticated user without agency access sees the unauthorized agency state for an invalid agency ID
    # This covers a bogus agency id that should still resolve to the unauthorized state.
    Given I am authenticated as an org member test user
    When I navigate directly to "/grantor/opportunities?agency=00000000-0000-0000-0000-000000000000"
    Then I should see "You do not have access to this agency's opportunities."
