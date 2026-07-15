# Feature: Opportunity Summary - Happy Path
# Related spec: e2e/opportunity/specs/happy-path-opportunity-summary.spec.ts
# Scenario: Happy path opportunity summary
#
# ============== Notes for reviewer ===============================================
# - This scenario validates opportunity summary completion and overview statuses.
# - Save actions are expected enabled throughout this page flow.
# - Overview status expectation after save-and-exit:
#   - Opportunity Summary: Complete
#   - Application Package: Not started
# ================================================================================

Feature: Opportunity summary happy path draft completion
  As a grantor user
  I want to complete the Opportunity Summary section
  So that overview statuses reflect section progress

  @GRANTOR
  Scenario: Happy path opportunity summary
    Given I am authenticated as a grantor user
    And I use direct URL "/grantor/opportunities" to navigate to the "Opportunities List" page
    And I create a new opportunity with happy-path data

    When I click "Opportunity Summary"
    Then I should be on the "Opportunity Summary" page
    And the "Save and exit" button should be enabled
    And the "Save and go back" button should be enabled
    And the "Save and continue" button should be enabled

    When I fill required "Funding details" values
    And I fill required "Eligibility" values
    And I fill optional "Additional information" values
    Then the "Save and exit" button should be enabled
    And the "Save and go back" button should be enabled
    And the "Save and continue" button should be enabled

    When I click "Save and exit"
    Then I should be on the "Opportunity Overview" page
    And I should see "Opportunity Summary" status as "Complete"
    And I should see "Application Package" status as "Not started"

    When I navigate directly to "/grantor/opportunities"
    Then I should see "Draft" status for "Title-mm-dd-yyyy-hh-mm-sec"
    And the matching "Draft" opportunity row should be visible
