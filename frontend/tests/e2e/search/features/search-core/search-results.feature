# @specFile frontend/tests/e2e/search/search-results.spec.ts
# @featureArea Search
# @debugNote Confirms visible positive-results states for valid keyword search

Feature: Search Results Visibility
  As a user on Search
  I want relevant opportunities returned for valid terms
  So that I can find funding opportunities quickly

  Background:
    Given I am on the Search Funding Opportunity page
    When I search for "grants"

  Scenario: Valid search term shows at least one result in heading
    Then the results heading should show at least 1 opportunity

  Scenario: Valid search term shows at least one list item
    Then the search results list should contain at least 1 item
