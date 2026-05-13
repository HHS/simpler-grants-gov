# @featureArea Search
# @specFile e2e/search/search-core/specs/search.spec.ts
# @debugNote Covers pagination, sorting, filter behavior, and out-of-range page handling

Feature: Search Core Search Behaviors
  As a user on Search
  I want filtering, sorting, and paging to behave consistently
  So that I can reliably explore opportunities

  Background:
    Given I am on the "Search funding opportunities" page
    And I wait for the search results to load

/* @tags GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION */
  Scenario: Page resets to 1 after filter change
    When I click to go to page 2 of the search results
    Then I should be on page 2
    When I open the filters
    And I select the "Opportunity status" filter category
    And I check the "Closed" opportunity status filter
    And I wait for the search results to load with the new filter
    Then the current page should reset to page 1
    And the URL should include "status=closed"

/* @tags GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION */
  Scenario: Flipping sort order reverses first and last result positions
    When I open the sort by dropdown
    And I select "Opportunity title (A to Z)" from the sort by dropdown
    Then the first result should be alphabetically first by opportunity title
    And I select "Opportunity title (Z to A)" from the sort by dropdown
    Then the first result should now be the alphabetically last opportunity title
    When I click to go to the last page of results
    Then the last result from the previous sort order should now be the first result

/* @tags GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION */
  Scenario: Result count is unchanged when all statuses are selected
    When I open the filters
    And I check all the opportunity status "Any opportunity status"
    Then the total results count is shown in the UI
    When I open the filters
    And I check all the opportunity status "Forecasted", "Open", "Closed", "Archived"
    Then the total results count is same

/* @tags GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION */
  Scenario: Out-of-range page query redirects to the last valid page
    When I navigate to "/search?page=1000000"
    Then I should be redirected to the last page of results
