# @featureArea Search
# @specFile e2e/search/search-core/spec/search-results.spec.ts
# @debugNote Confirms visible positive-results states for valid keyword search

Feature: Search Results Visibility
  As a user on Search
  I want relevant opportunities returned for valid terms
  So that I can find funding opportunities quickly

  Background:
    Given I am on the "Search funding opportunity" page
    When I search for "grants"

  Scenario: Valid search term shows at least one result in heading
    Then the results heading should show at least 1 opportunity
    And the search results list should contain at least 1 item
