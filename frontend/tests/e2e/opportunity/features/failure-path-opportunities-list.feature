Feature: Grantor opportunities list failure paths
  In order to validate grantor opportunity access failure states
  As a grantor application user
  I want to see the correct failure UI when I am not authenticated, have no agencies, or request an unauthorized agency

  Scenario: Unauthenticated user cannot access the grantor opportunities list page
    Given I am not authenticated
    When I navigate to "/grantor/opportunities"
    Then I should see "Not signed in"
    And I should see "Sign in first in order to view this page"

  Scenario: Authenticated user with no agencies sees the no-agency state
    Given I am authenticated as a test user with no agency associations
    When I navigate to "/grantor/opportunities"
    Then I should see "You are not associated with any agencies."

  Scenario: Authenticated org member with agencies but not in the requested agency sees an unauthorized agency state for a valid non-member agency ID
    Given I am authenticated as a test user with agency membership
    When I navigate to "/grantor/opportunities?agency=VALID_NON_MEMBER_AGENCY_ID"
    Then I should see "You do not have access to this agency's opportunities."

  Scenario: Authenticated org member with agencies but not in the requested agency sees an unauthorized agency state for an invalid agency ID
    Given I am authenticated as a test user with agency membership
    When I navigate to "/grantor/opportunities?agency=INVALID_AGENCY_ID"
    Then I should see "You do not have access to this agency's opportunities."
