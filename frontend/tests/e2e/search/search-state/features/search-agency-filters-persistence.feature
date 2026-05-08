/**
* @featureArea Search
* @feature Search State Persistence
* @specFile e2e/search/search-state/specs/search-state-persistence.spec.ts
* @description Validates persistence of agency filters after page refresh
*/
 
Feature: Search page - state persistence after refresh
  As a grantee searching for opportunities
  I want my search filters and inputs to be preserved in the URL
  So that I can refresh the page and return to the same search state
 
Background:
  Given I am on the search page
  And the search results have loaded
 
/* @tags GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION */
Scenario: Retain top-level agency filter after refresh
  When I open the filter drawer
  And agency filter options have loaded
  And the "Agency" accordion is expanded
  When I check the first available top-level agency "All" checkbox
  Then the URL should contain query param "topLevelAgency"
  When I refresh the page
  Then the search results load
  And the filter drawer is open
  And the "Agency" accordion is expanded
  And the previously selected top-level agency checkbox should be checked
  And the URL should contain query param "topLevelAgency" with the previously selected values
 
/* @tags GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION */
Scenario: Retain sub-agency filter after refresh
  When I open the filter drawer
  And agency filter options have loaded
  And the "Agency" accordion is expanded
  And sub-agency options are visible
  When I check the first available sub-agency checkbox with results
  Then the URL should contain query param "agency" with the selected sub-agency value
  When I refresh the page
  Then the search results load
  And the filter drawer is open
  And agency filter options have loaded
  And the "Agency" accordion is expanded
  And sub-agency options are visible
  And the previously selected sub-agency checkbox should be checked
  And the URL should contain query param "agency" with the selected sub-agency value
