# Feature: Opportunity Competition - Happy Path
# Related spec: e2e/opportunity/specs/happy-path-application-package.spec.ts
# Scenario: Happy path application package
#
# ============== Notes for reviewer ===============================================
# - This scenario validates application package completion and overview statuses.
# - Save actions are expected enabled throughout this page flow.
# - Overview status expectation after save-and-exit:
#   - Opportunity Summary: Not started
#   - Application Package: Complete
# ================================================================================

Feature: Opportunity application package happy path draft completion
  As a grantor user
  I want to complete the Application Package section
  So that overview statuses reflect section progress

  @GRANTOR @CORE_REGRESSION
  Scenario: Happy path application package
    Given I am authenticated as a grantor user
    And I create a new opportunity with happy-path data

    When I click "Application Package" link
    Then I should be on the "Application Package" page
    And the "Save and go back" button should be enabled
    And the "Save and exit" button should be enabled
    And the "Save and continue" button should be enabled

    When I fill required "Submission set-up" values
    And I fill required "Submission window" values
    And I fill required "Agency contact" values
    Then the "Save and go back" button should be enabled
    And the "Save and exit" button should be enabled

    When I click "Save and exit"
    Then I should be on the "Opportunity Overview" page
    And I should see "Opportunity Summary" status as "Not started"
    And I should see "Application Package" status as "Complete"

    When I navigate directly to "/grantor/opportunities"
    Then I should see "Draft" status for the created opportunity row
    And the matching row should be visible
