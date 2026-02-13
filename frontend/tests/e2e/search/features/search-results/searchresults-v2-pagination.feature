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

Scenario: Pagination controls are visible when multiple pages exist
  Then I should see pagination controls
  And I should see a page number indicator
  And the first page should be marked as active
  And the "Previous" button should be disabled
  And the "Next" button should be enabled

Scenario: User navigates to the next page
  When I click the "Next" button
  Then I should be taken to page 2
  And page 2 should be marked as active
  And the "Previous" button should be enabled

Scenario: User navigates using page number
  When I click on page number 3
  Then I should be taken to page 3
  And page 3 should be marked as active

Scenario: User navigates back to the previous page
  Given I am on page 2
  When I click the "Previous" button
  Then I should be taken to page 1
  And page 1 should be marked as active
  And the "Previous" button should be disabled

Scenario: Pagination controls appear when results exceed page size
  Given the user applies multiple filters and search returns more results that fit on one page
  Then pagination controls should be displayed
  And I should see page number indicator
  And the "Next" and "Previous" buttons should be visible
  And the current page indicator should be highlighted

Scenario: Pagination controls are hidden when only one page of results exists
  Given the search returns results that fit on a single page
  Then pagination controls should not be displayed

Scenario: Total number of results is displayed
  Given the search returns results
  Then I should see total results count
  And the count should match the number returned by the backend

Scenario: "Next" button is hidden on the last page
  Given I am on the last page of results
  Then the "Next" button should not be visible

Scenario: "Previous" button is hidden on the first page
  Given I am on the first page of results
  Then the "Previous" button should not be visible

Scenario: Pagination displays ellipsis for long page ranges
  Given the search returns many pages of results
  Then pagination should display ellipses ("…") to indicate skipped pages

Scenario: Sort order is preserved after page navigation
  Given I sort the results by "<sortOption>"
  When I navigate to the next page
  Then the sort order should remain applied

Examples:
  |  sortOption                  |
  |  Most relevant (Default)     |
  |  Close date (Furthest)       |
  |  Close date (Soonest)        |
  |  Posted date (Newest)        |
  |  Posted date (Oldest)        |
  |  Opportunity title (A to Z)  |
  |  Opportunity title (Z to A)  |
  |  Award minimum (Lowest)      |
  |  Award minimum (Highest)     |
  |  Award maximum (Lowest)      |
  |  Award maximum (Highest)     |

# Awaiting confirmation on expected behavior
Scenario: Page resets to first page when filters change
  Given I am on page 5
  When I change the search filters
  Then I should be taken back to page 1
  And the first page indicator should be active 