Feature: Filter Drawer - Mobile Sort
  As a user
  I want to use the sort dropdown in the filter drawer on mobile
  So that I can order search results according to my preference

Background:
    Given I am on the Search Funding Opportunity page
    And my login state is "<loginState>"
    And the viewport is set to "<viewport>"
    And I open the filter drawer

# Positive Scenarios
Scenario: Sort dropdown is visible on mobile
    Then the sort dropdown should be visible in the drawer

Examples:
    | loginState    | viewport  |
    | logged in     | mobile    |
    | not logged in | mobile    |
    | logged in     | desktop   |
    | not logged in | desktop   |

Scenario: Selecting a sort option updates results
    When I select the sort option "<sortOption>"
    Then the results should be updated according to "<sortOption>"
    And the sort option should be reflected in the URL as a query parameter

Scenario: Selected sort option is displayed in UI
    When I select the sort option "<sortOption>"
    Then the sort dropdown label should show "<sortOption>"
    And the selected option should be highlighted

Scenario: Changing sort multiple times updates results each time
    When I select the sort option "<firstSortOption>"
    Then the results should update according to "<firstSortOption>"
    When I select the sort option "<secondSortOption>"
    Then the results should update according to "<secondSortOption>"
    And the sort dropdown should show "<secondSortOption>"

Scenario: Drawer open/close does not affect selected sort
    When I select the sort option "<sortOption>"
    And I close the drawer
    And I reopen the drawer
    Then the sort dropdown should still show "<sortOption>"

# Negative / Edge Scenarios
Scenario: Sort dropdown is hidden or disabled on desktop
    Given the viewport is set to "desktop"
    Then the sort dropdown should be hidden or disabled

Scenario: Sort dropdown handles empty result sets gracefully
    Given there are no matching search results
    Then selecting any sort option should not break the page
    And the sort dropdown should still be visible (or disabled if appropriate)

# UI Validation
Scenario: Sort does not break layout with many filters selected
    Given multiple filters are selected in the drawer
    When I select a sort option "<sortOption>"
    Then the drawer and page layout should not be broken

Examples:
    | sortOption         |
    | Closing Date       |
    | Funding Instrument |
    | Agency             |
    | Eligibility        |
