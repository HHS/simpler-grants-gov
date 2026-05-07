/**
* @featureArea Search
* @feature Search State Persistence
* @specFile e2e/search/search-state/specs/search-state-persistence.spec.ts
* @description Validates persistence of core filters after page refresh
*/

Feature: Search page - state persistence after refresh
  As a grantee searching for opportunities
  I want my search filters and inputs to be preserved in the URL
  So that I can refresh the page and return to the same search state

Background:
  Given I am on the search page
  And the search results have loaded
 
/* @tags GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION */
Scenario: Retain status filter after refresh
    When I open the filter drawer
    And the "Opportunity status" accordion is expanded
    When I check the "<Opportunity status>" checkbox
    Then the browser URL contains query param "status" with values "<expected statuses>"
    When I refresh the page
    Then the search results load
    And the filter drawer is open
    And the "Opportunity status" accordion is expanded
    And the "<Opportunity status>" checkbox should be checked
    And the browser URL contains query param "status" with values "<expected statuses>"

Examples:
    | Opportunity status | expected statuses           |
    | Closed             | forecasted,posted,closed   |
    | Posted             | forecasted,posted          |

/* @tags GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION */
Scenario: Retain funding instrument filter after refresh
    When I open the filter drawer
    And the "Funding instrument" accordion is expanded
    When I check the "<funding instrument>" checkbox
    Then the browser URL contains query param "fundingInstrument" with values "<expected values>"
    When I refresh the page
    Then the search results load
    And the filter drawer is open
    And the "Funding instrument" accordion is expanded
    And the "<funding instrument>" checkbox should be checked
    And the browser URL contains query param "fundingInstrument" with values "<expected values>"

Examples:
    | funding instrument | expected values |
    | Grant              | grant           |
    | Other              | other           |

/* @tags GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION */
Scenario: Retain eligibility filter after refresh
    When I open the filter drawer
    And the "Eligibility" accordion is expanded
    When I check the "<eligibility>" checkbox
    Then the browser URL contains query param "eligibility" with values "<expected values>"
    When I refresh the page
    Then the search results load
    And the filter drawer is open
    And the "Eligibility" accordion is expanded
    And the "<eligibility>" checkbox should be checked
    And the browser URL contains query param "eligibility" with values "<expected values>"

Examples:
    | eligibility         | expected values        |
    | County Governments  | county_governments     |
    | State Governments   | state_governments      |

/* @tags GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION */
Scenario: Retain category filter after refresh
    When I open the filter drawer
    And the "Category" accordion is expanded
    When I check the "<category>" checkbox
    Then the browser URL contains query param "category" with values "<expected values>"
    When I refresh the page
    Then the search results load
    And the filter drawer is open
    And the "Category" accordion is expanded
    And the "<category>" checkbox should be checked
    And the browser URL contains query param "category" with values "<expected values>"

Examples:
    | category        | expected values |
    | Agriculture     | agriculture     |
    | Recovery Act    | recovery_act    |
