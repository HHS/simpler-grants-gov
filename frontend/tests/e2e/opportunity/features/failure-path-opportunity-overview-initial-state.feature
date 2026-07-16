# Feature: Opportunity Overview - Failure Path (Initial State)
# Related spec: e2e/opportunity/specs/failure-path-opportunity-overview-initial-state.spec.ts
# Scenario: Verifies bypass attempt fails and stays on the same overview page
#
# Notes:
# - This scenario verifies disabled-action gating on Opportunity Overview.
# - Preview and Publish should not navigate when force-clicked in initial state.

Feature: Opportunity overview failure path initial state gating
  As a grantor user
  I want disabled overview actions to block navigation
  So that I cannot bypass incomplete setup and navigate incorrectly

  @GRANTOR @CORE_REGRESSION
  Scenario: Verifies bypass attempt fails and stays on the same overview page
    Given I am authenticated as a grantor user
    And I create a new opportunity with happy-path data
    Then I should be on the "Opportunity Overview" page

    When I force-click the "Preview" button
    Then I should still be on the same overview page

    When I force-click the "Publish" button
    Then I should still be on the same overview page
