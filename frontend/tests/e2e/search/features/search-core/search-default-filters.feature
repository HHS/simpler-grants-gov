# @specFile e2e/search/search-default-filters.spec.ts
# @featureArea Search
# @debugNote Checks default filters on search page load

Feature: Search - Default Filters
  As a user on Search
  I want the correct filters to be checked by default
  So that I can quickly find relevant opportunities

  Scenario: Load search page with forecasted and open filters checked by default
    Given I am on the "Search funding opportunity" page
    Then I see the "Search funding opportunities" heading
    And the 'forecasted' and 'posted' filters are checked by default
