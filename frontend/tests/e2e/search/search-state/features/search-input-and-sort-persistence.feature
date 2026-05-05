/**
* @featureArea Search
* @feature Search State Persistence
* @specFile e2e/search/search-state/specs/search-state-persistence.spec.ts
* @description Validates persistence of search query and sort selection after page refresh
* @tags GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION, FULL_REGRESSION
*/

Feature: Search page - state persistence after refresh
  As a grantee searching for opportunities
  I want my search filters and inputs to be preserved in the URL
  So that I can refresh the page and return to the same search state
 
Background:
  Given I am on the search page
  And the search results have loaded
 
@grantee @opportunity_search @core_regression
Scenario: Retain search input and sort after refresh
  When I enter "<search-term>" in the search input and submit
  And I open the filter drawer
  And I select sort order "<sort label>"
  Then the browser URL contains "/search?query=<search-term>"
  And the browser URL contains "sortby=<sort type>"
  When I refresh the page
  Then the search results load
  And the search input should contain "<search-term>"
  And the sort order should be "<sort label>"
  And the browser URL contains "query=<search-term>"
  And the browser URL contains "sortby=<sort type>"
 
Examples:
  | search-term | sort label                 | sort type        |
  | education   | Award Ceiling (Descending) | awardCeilingDesc |
 