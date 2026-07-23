# Feature: Opportunity Summary - Failure Path
# Related spec: e2e/opportunity/specs/failure-path-opportunity-summary.spec.ts
# Scenarios:
# - Required-field validation
# - Negative number validation
# - Email format validation
# - Cross-field validation
# - Character limits validation
#
# ============== Notes for reviewer ===============================================
# - This feature validates Opportunity Summary edit-page failure-path behavior.
# - Each scenario starts from a freshly created draft opportunity.
# - Validation is triggered with the "Save and exit" button in all scenarios.
# - The edit route should remain stable during validation checks.
# ================================================================================

Feature: Opportunity summary failure path validation
  As a grantor user
  I want invalid Opportunity Summary inputs to be blocked
  So that required and format rules are enforced before exit/publish actions

  Background:
    Given I am authenticated as a grantor user
    And I create a new opportunity with happy-path data
    And I should be on the "Opportunity Overview" page
    And I click "Opportunity Summary"
    And I should be on the "Opportunity Summary" page
    And the "Save and exit" button should be enabled
    And the "Save and go back" button should be enabled
    And the "Save and continue" button should be enabled

  @GRANTOR @CORE_REGRESSION
  Scenario: Required-field validation on Opportunity Summary
    When I clear required Funding details and Eligibility values
    And I click "Save and exit" button
    Then I should remain on the "Opportunity Summary" page
    And I should see required-field validation errors

  @GRANTOR @CORE_REGRESSION
  Scenario: Negative number validation on Opportunity Summary
    When I enter "-10" in numeric Funding details fields
    And I click "Save and exit" button
    Then I should remain on the "Opportunity Summary" page
    And I should see negative-number validation errors

  @GRANTOR @CORE_REGRESSION
  Scenario: Email format validation on Opportunity Summary
    When I enter "ABC" in Contact email
    And I click "Save and exit" button
    Then I should remain on the "Opportunity Summary" page
    And I should see email format validation errors

  @GRANTOR @CORE_REGRESSION
  Scenario: Cross-field validation on Opportunity Summary
    When I enter Award minimum greater than Award maximum
    And I click "Save and exit" button
    Then I should remain on the "Opportunity Summary" page
    And I should see cross-field validation errors

    When I enter Award minimum and Award maximum greater than Estimated total program funding
    And I click "Save and exit" button
    Then I should remain on the "Opportunity Summary" page
    And I should see cross-field validation errors

  @GRANTOR @CORE_REGRESSION
  Scenario: Character limits validation on Opportunity Summary
    When I enter over-limit values in Opportunity Summary fields
    And I click "Save and exit" button
    Then I should remain on the "Opportunity Summary" page
    And I should see character-limit validation messages for all character-limited fields
