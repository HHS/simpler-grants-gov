# @specFile search-copy-url.spec.ts
# @featureArea Search
# @debugNote Validates clipboard copy behavior for search URL sharing

Feature: Search Copy URL
  As a user on Search
  I want to copy the current search URL
  So that I can share or reuse the same search

  Background:
    Given I am on the Search Funding Opportunity page

  Scenario: Copy search URL and paste into the search input
    Given I search for "education grants"
    And the Copy this search query control is visible
    When I click Copy this search query
    And I paste from clipboard into the search input
    Then the search input should contain "/search?query=education+grants"
