# @specFile frontend/tests/e2e/search/search-loading.spec.ts
# @featureArea Search
# @debugNote Checks loading indicator visibility on search

Feature: Search - Loading State
  As a user on Search
  I want to see a loading message when searching
  So that I know the system is working

  Scenario: Show and hide loading indicator on search
    Given I am on the "Search funding opportunity" page
    When I submit a <search term>
    Then the loading indicator should be visible, then hidden
    When I submit another <search term>
    Then the loading indicator should be visible, then hidden again
