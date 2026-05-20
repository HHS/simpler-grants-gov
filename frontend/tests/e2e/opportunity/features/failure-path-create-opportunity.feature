# Failure path feature for Opportunity creation
# This feature file is based on the shared negative-path-forms.feature template.

Feature: Opportunity - Failure Path

  Background:
    Given the user is able to login with all roles needed
    And the system is available

  Scenario: Create Opportunity with duplicate number
    Given the user is logged in
    And the user navigates to the Opportunities List page
    When the user creates a new Opportunity with a unique number
    And the user returns to the Opportunities List page
    When the user attempts to create another Opportunity with the same number
    Then an error message is shown indicating the Opportunity number already exists
    And the user is returned to the Opportunities List page
    And the duplicate Opportunity is listed

  Scenario: Create Opportunity with invalid Assistance Listing Number
    Given the user is logged in
    And the user navigates to the Opportunities List page
    When the user creates a new Opportunity with an invalid Assistance Listing Number
    Then an error message is shown indicating the Assistance Listing Number is invalid

  Scenario Outline: Opportunity field character limit validation
    Given the user is logged in
    And the user navigates to the Opportunities List page
    When the user creates a new Opportunity with <field> set to a value exceeding the character limit
    Then a validation error is shown for <field>

    Examples:
      | field                |
      | Opportunity number   |
      | Opportunity title    |
      | Assistance listing number |
