# @specFile frontend/tests/e2e/search/features/frontend/tests/e2e/search/features/search-core/search-copy-url.feature
# @featureArea Search
# @debugNote Validates clipboard copy behavior for search URL sharing

Feature: Search Copy URL
  As a user on Search
  I want to copy the current search URL
  So that I can share or reuse the same search

  Background:
    Given I am on the "Search funding opportunity" page

  Scenario: Copy search URL and paste into the search input
    Given I search for "<search-term>"
    Then the browser URL contains "/search?query=<search term>"
    And the Copy this search query control is visible
    When I click Copy this search query
    And I paste from clipboard into the search input
    Then the search input should contain "/search?query=<search term>"
