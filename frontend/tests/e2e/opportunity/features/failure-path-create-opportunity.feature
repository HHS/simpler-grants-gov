# Feature: Create opportunity - Failure Path
# Related spec: e2e/opportunity/specs/failure-path-create-opportunity.spec.ts
# Scenario: Failure path - Create Opportunity validations
#
# Notes:
# - This scenario verifies duplicate-value validation, required-field Save gating,
#   and character-limit validation on the Create Opportunity page.

Feature: Opportunity failure path create opportunity
  As a grantor user
  I want create-opportunity validations to prevent invalid submissions
  So that duplicate and invalid data is blocked before continuing

  @GRANTOR @CORE_REGRESSION
  Scenario: Validate duplicate data, required fields, and character limits on create opportunity
    Given I am authenticated as a grantor user
    And I create a new opportunity with valid values

    When I start a new create opportunity flow with the same values
    And I click "Save and continue" button
    Then I should see duplicate validation messages for duplicate-enabled fields
    And I should remain on the "Create Opportunity" page
    And the "Save and continue" button should be disabled
    And the "Cancel" button should be enabled

    When I click "Cancel"
    And I navigate back to a fresh "Create Opportunity" page
    Then "Save and continue" should remain disabled until all required fields are filled
    And the "Cancel" button should stay enabled

    When I click "Cancel"
    And I navigate back to a fresh "Create Opportunity" page
    And I fill create-opportunity fields with over-limit values
    And I click "Save and continue" button
    Then I should remain on the "Create Opportunity" page
    And I should see character-limit validation messages for all character-limited fields
    And the "Save and continue" button should be disabled
    And the "Cancel" button should be enabled
