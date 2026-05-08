# @featureArea Search
# @specFile e2e/search/search-core/specs/search-error.spec.ts
# @debugNote Covers invalid query error state and recovery path

Feature: Search Error Handling and Recovery
  As a user on Search
  I want invalid query states to be handled clearly
  So that I can recover and continue searching

/* @tags GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION */
  Scenario: Invalid status query shows error state
    Given I navigate to "/search?<param>=<invalid_value>"
    Then the search error state is shown
    
    Examples:
    | param     | invalid_value |
    | status    | not_a_status  |
    | category  | invalid_value |
    Then I should see an error alert on the page

/* @tags GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION */
  Scenario: Recover from error state by applying a valid filter
    Given I navigate to "/search?status=not_a_status"
    When I open the filters
    And I select the "Closed" opportunity status filter
    Then the URL should include "status=closed"
