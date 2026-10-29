# @featureArea Search
# @feature Search State Error Handling and Recovery
# @specFile tests/e2e/search/search-state/specs/search-error-recovery.spec.ts
# @debugNote Covers invalid filter values in the URL and the recovery path

Feature: Search State Error Handling and Recovery
  As a user on Search
  I want invalid filter values in the URL to be discarded
  And the URL to reflect the filters that were actually applied
  So that I can continue searching without restarting

/* @tags GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION */
  Scenario: Invalid filter value is dropped from the URL
    Given I navigate to "/search?<param>=<invalid_value>"
    Then the "<param>" param should be removed from the URL
    And I should not see an error alert
    And I should see search results

    Examples:
    | param     | invalid_value |
    | status    | not_a_status  |
    | category  | invalid_value |

/* @tags GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION */
  Scenario: Valid filter values survive alongside an invalid one
    Given I navigate to "/search?status=not_a_status,closed"
    Then the URL should update to "status=closed"
    And I should not see an error alert

/* @tags GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION */
  Scenario: Applying a filter after an invalid one does not re-append the invalid value
    Given I navigate to "/search?status=not_a_status"

    When I open the filter drawer
    And I select the "Closed" opportunity status filter
    Then the URL should update to "status=closed"
    And the URL should not contain "not_a_status"
    And I should not see an error alert
    And I should not see an unlabeled filter pill
