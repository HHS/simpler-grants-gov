# @specFile frontend/tests/e2e/search/search-no-results.spec.ts
# @featureArea Search
# @debugNote Verifies zero-results state and user-facing message

Feature: Search No Results State
  As a user on Search
  I want a clear no-results state for unmatched queries
  So that I know when I should refine my search

  Background:
    Given I am on the Search Funding Opportunity page

  Scenario: Obscure keyword returns zero opportunities
    When I search for an obscure random keyword
    Then I should see the heading "0 Opportunities"
    And I should see "Your search didn't return any results."
