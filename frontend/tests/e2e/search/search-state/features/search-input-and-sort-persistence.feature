@grantee @opportunity_search

Feature: Search page - state persistence after refresh
  As a grantee searching for opportunities
  I want my search filters and inputs to be preserved in the URL
  So that I can refresh the page and return to the same search state
 
Background:
  Given I am on the search page
  And the search results have loaded
 
@core_regression
Scenario: Retain search input and sort after refresh
  When I enter "<search-term>" in the search input and submit
  And I open the filter drawer
  And I select sort order "<sort label>"
  Then the browser URL contains "/search?query=<search-term>"
  And the browser URL contains "sortby=awardCeilingDesc"
  When I refresh the page
  Then the search results load
  And the search input should contain "<search-term>"
  And the sort order should be "<sort label>"
  And the browser URL contains "query=<search-term>"
  And the browser URL contains "sortby=awardCeilingDesc"
 
Examples:
  | search-term | sort label                 |
  | education   | Award Ceiling (Descending) |
 