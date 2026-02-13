Feature: Search Results Pagination – Results Table
  As a user searching for funding opportunities
  I want to navigate through paginated search results
  So that I can browse all available opportunities

Background:
  Given I am on the Search Funding Opportunity page
  And search results are displayed
  And my login state is "<loginState>"

Examples:
  | loginState      |
  | logged in       |
  | not logged in   |
