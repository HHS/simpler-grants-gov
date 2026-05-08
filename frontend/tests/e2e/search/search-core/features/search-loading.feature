# @featureArea Search
# @specFile e2e/search/search-core/specs/search-loading.spec.ts
# @debugNote Checks loading indicator visibility on search

Feature: Search - Loading State
  As a user on Search
  I want to see a loading message when searching
  So that I know the system is working

  Scenario: Loading indicator appears and disappears for each search in a session
    Given I am on the "Search funding opportunity" page
    When I search for "<search term-1>"
    Then the loading indicator should appear
    And the loading indicator should disappear after results load
    When I search for another "<search term-2>"
    Then the loading indicator should appear
    And the loading indicator should disappear after results load
