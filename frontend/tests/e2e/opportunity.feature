Feature: Opportunity page
  As a visitor
  I want clear opportunity details
  So I can read the page and open Grants.gov

  Background:
    Given I open the Opportunity page for the configured test opportunity ID

  Scenario: Show the page title
    Then the page title should start with "Opportunity Listing -"

  Scenario: Show key page content
    Then I should see "Application process" in "Application process section"

  Scenario: Expand and collapse the opportunity description
    Given I should see "Show full description" in "Opportunity description"
    And I should not see "Hide full description" in "Opportunity description"
    When I click "Show full description" in "Opportunity description"
    Then I should see "Hide full description" in "Opportunity description"
    And I should not see "Show full description" in "Opportunity description"
    And I should see more visible page content in "Opportunity description"
    When I click "Hide full description" in "Opportunity description"
    Then I should see "Show full description" in "Opportunity description"
    And I should not see "Hide full description" in "Opportunity description"
    And I should see less visible page content in "Opportunity description"

  Scenario: Expand and collapse the close date description
    Given I should see "Show full description" in "Opportunity status"
    And I should not see "Hide full description" in "Opportunity status"
    When I click "Show full description" in "Opportunity status"
    Then I should see "Hide full description" in "Opportunity status"
    And I should not see "Show full description" in "Opportunity status"
    And I should see more visible page content in "Opportunity status"
    When I click "Hide full description" in "Opportunity status"
    Then I should see "Show full description" in "Opportunity status"
    And I should not see "Hide full description" in "Opportunity status"
    And I should see less visible page content in "Opportunity status"

  Scenario: Open Grants.gov in a new tab
    Given I should see "View on Grants.gov"
    When I click "View on Grants.gov"
    Then a new tab should open
    And the new tab URL should contain "grants.gov/search-results-detail/"
