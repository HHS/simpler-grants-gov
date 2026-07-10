# @featureArea Search
# @feature Search State Error Handling and Recovery
# @specFile tests/e2e/search/search-state/specs/search-error-recovery.spec.ts
# @debugNote Covers invalid query error state and recovery path

Feature: Search Error state and Recovery
  As a user on Search
  I want the system to handle invalid query states clearly
  And recover when I apply a valid filter
  So that I can continue searching without restarting

/* @tags GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION */
  Scenario: Invalid status query shows error state
    Given I navigate to "/search?<param>=<invalid_value>"
    Then I should see an error alert

/* @tags GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION */
  Scenario: Recover from error state when applying a valid filter
    Given I navigate to "/search?<param>=<invalid_value>"
    And I should see an error alert

    When I open the filter drawer
    And I select the "Closed" opportunity status filter
    Then the URL should update to include "status=closed"
    
    Examples:
    | param     | invalid_value |
    | status    | not_a_status  |
    | category  | invalid_value |
