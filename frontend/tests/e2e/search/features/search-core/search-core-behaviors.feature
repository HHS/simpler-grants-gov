# @specFile frontend/tests/e2e/search/search.spec.ts
# @featureArea Search
# @debugNote Covers paging reset, sort reversal, status filter counts, and out-of-range page redirects

Feature: Search Core Behaviors
  As a user on Search
  I want filtering, sorting, and paging to behave consistently
  So that I can reliably explore opportunities

  Scenario: Page resets to 1 after filter change
    Given I am on "/search?status=none"
    And I navigate to page 2
    When I apply the "Closed" status filter
    Then page 1 should be active
    And the URL should include "status=closed"

  Scenario: Flipping sort order reverses first and last result positions
    Given I am on the Search Funding Opportunity page
    When I sort by "Opportunity title (A to Z)"
    And I capture the first result title
    And I sort by "Opportunity title (Z to A)"
    And I navigate to the last page
    Then the last result title should equal the previously captured first title

  Scenario: Result count is unchanged when all statuses are selected
    Given I am on "/search?status=none"
    And I capture the current result count
    When I select all opportunity status filters
    Then the result count should remain unchanged

  Scenario: Out-of-range page query redirects to the last valid page
    Given I navigate to "/search?page=1000000"
    Then I should be redirected to a valid search page number
