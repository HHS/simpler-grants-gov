# @specFile search.spec.ts
# @featureArea Search
# @debugNote Covers pagination, sorting, filter behavior, and out-of-range page handling

Feature: Search Core Search Behaviors
  As a user on Search
  I want filtering, sorting, and paging to behave consistently
  So that I can reliably explore opportunities

  Background:
    Given I am on the Search Funding Opportunity page
    And I wait for the search results to load

  Scenario: Refresh and retain filters and sort order with search term and multiple filters
    When I enter "education" in the search input and submit
    And I select "Award maximum (Highest)" from the sort by dropdown
    And I open the filters
    And I select the "Opportunity status" filter category
    And I check the "Closed" opportunity status filter (with "forecasted,posted" preselected)
    And I select the "Funding instrument" filter category
    And I check the "Other" and "Grant" funding instrument filters
    And I select the "Eligibility" filter category
    And I check the "State governments" and "County governments" eligibility filters
    And I select the "Agency" filter category
    And I check the first available agency filter with a valid ID
    And I select the "Category" filter category
    And I check the "Recovery Act" and "Agriculture" category filters
    When I refresh the page
    And I wait for the search results to load after the refresh
    Then the sort order should still be "Award maximum (Highest)"
    And all the same filters I selected before the refresh should still be selected after the refresh
    And the search input should still have the value "education"
    And the "Closed" opportunity status filter should still be selected after the refresh
    And the "Other" and "Grant" funding instrument filters should still be selected after the refresh
    And the "State governments" and "County governments" eligibility filters should still be selected after the refresh
    And the first available agency filter with a valid ID should still be selected after the refresh
    And the "Recovery Act" and "Agriculture" category filters should still be selected after the refresh

  Scenario: Page resets to 1 after filter change
    When I click to go to page 2 of the search results
    Then I should be on page 2
    When I open the filters
    And I select the "Opportunity status" filter category
    And I check the "Closed" opportunity status filter
    And I wait for the search results to load with the new filter
    Then the current page should reset to page 1
    And the URL should include "status=closed"

  Scenario: Flipping sort order reverses first and last result positions
    When I open the sorting
    And I select "Opportunity title (A to Z)" from the sort by dropdown
    Then the first result should be alphabetically first by opportunity title
    When I open the filters
    And I select "Opportunity title (Z to A)" from the sort by dropdown
    Then the first result should now be the alphabetically last opportunity title
    When I click to go to the last page of results
    Then the last result from the previous sort order should now be the first result

  Scenario: Result count is unchanged when all statuses are selected
    When I open the filters
    And I check all the opportunity status "Any opportunity status"
    Then the total results count is shown in the UI
    When I open the filters
    And I check all the opportunity status "Forecasted", "Open", "Closed", "Archived"
    Then the total results count is same

  Scenario: Out-of-range page query redirects to the last valid page
    When i navigate to "/search?page=1000000"
    Then I should be redirected to the last page of results
