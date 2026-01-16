Feature: Filter Drawer - Clear Filters
  As a user
  I want the Clear Filters button in the filter drawer to reset my selections
  So that I can start a new search without manually deselecting each filter

Background:
    Given I am on the Search Funding Opportunity page
    And my login state is "<loginState>"
    And I open the filter drawer

Examples:
      | loginState      |
      | logged in       |
      | not logged in   |

# Positive Scenarios
Scenario: Clear Filters button is visible when filters are selected
    Given I have selected one or more filters
    Then the Clear Filters button should be visible

Scenario: Clicking Clear Filters deselects all filters
    Given I have selected one or more filters
    When I click the Clear Filters button
    Then all selected filters should be deselected

Scenario: Clicking Clear Filters updates results immediately
    Given I have selected one or more filters
    When I click the Clear Filters button
    Then the search results should update to reflect no filters

Scenario: Clicking Clear Filters updates UI and URL correctly
    Given I have selected one or more filters
    When I click the Clear Filters button
    Then the UI should show no filters selected
    And the URL should no longer contain filter query parameters

Scenario: Clear Filters works across multiple facets
    Given I have selected filters from Funding Instrument, Eligibility, and Agency
    When I click the Clear Filters button
    Then all selected filters across all facets should be cleared
    And results should update accordingly

Scenario: Clear Filters works for logged-in and not logged-in users
    Given I have selected one or more filters
    When I click the Clear Filters button
    Then the filters should be cleared for "<loginState>"

# Negative / Edge Cases
Scenario: Clicking Clear Filters with no filters selected does nothing
    Given no filters are selected
    When I click the Clear Filters button
    Then no filters should be selected
    And results should remain unchanged

Scenario: Clear Filters does not remove filters applied outside the drawer
    Given a filter is applied via the search bar
    And I have selected additional filters in the drawer
    When I click the Clear Filters button
    Then only the drawer filters should be cleared
    And the search bar filter should remain applied

# UI / Layout Validation
Scenario: Clear Filters does not break drawer or page layout
    Given multiple filters are selected
    When I click the Clear Filters button
    Then the drawer and page layout should remain intact

Scenario: Clear Filters resets selections after page reload
    Given I have selected one or more filters
    And I reload the page
    When I click the Clear Filters button
    Then all selected filters should be deselected
    And results should update accordingly

Scenario: Clear Filters button works across different viewports
    Given the viewport is set to "<viewport>"
    And I have selected one or more filters
    When I click the Clear Filters button
    Then all selected filters should be deselected
    And the search results should update accordingly
    And the Clear Filters button should behave correctly for "<viewport>"

Examples:
    | viewport  |
    | mobile    |
    | desktop   |
