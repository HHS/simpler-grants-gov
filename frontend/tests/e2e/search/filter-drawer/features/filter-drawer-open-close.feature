Feature: Filter Drawer Open / Close Behavior
  As a user
  I want to open and close the filter drawer reliably
  So that I can interact with filters without UI issues

Background:
    Given I am on the Search Funding Opportunity page
    And my login state is "<loginState>"

Examples:
    | loginState      |
    | logged in       |
    | not logged in   |

# Positive Scenarios
Scenario: Drawer opens when clicking the 'Filters' button
    When I click the 'Filters' button
    Then the drawer should be visible

Scenario: Drawer closes when clicking the close (X) button
    When I open the drawer
    And I click the close (X) button
    Then the drawer should not be visible

Scenario: Drawer closes when clicking 'View Results'
    When I open the drawer
    And I click the 'View Results' button
    Then the drawer should not be visible

Scenario: Selected filters persist after closing and reopening the drawer
  When I open the drawer
  And I select one or more filters
  And I close the drawer
  And I reopen the drawer
  Then the previously selected filters should still be selected
  And the drawer should display the selected filter counts correctly

Scenario: Drawer open/close does not reset filter selections
  When I open the drawer
  And I select multiple filters
  And I close the drawer
  And I reopen the drawer
  Then all previously selected filters should remain selected

# Desktop / Tablet Specific Scenarios
Scenario: Drawer closes when clicking outside the drawer area
    Given the viewport is set to "<viewport>"
    When I open the drawer
    And I click outside the drawer
    Then the drawer should not be visible

Examples:
    | viewport   |
    | desktop    |
    | tablet     |

# Negative / Edge Cases
Scenario: Drawer should not break if opened multiple times quickly
    When I click the 'Filters' button multiple times rapidly
    Then the drawer should be visible
    And no errors should occur

# Accessibility Scenarios
Scenario: Drawer opens/closes using keyboard shortcuts
    When I focus on the 'Filters' button
    And I press "<key>"
    Then the drawer should open or close accordingly

Examples:
    | key   |
    | Enter |
    | Space |

Scenario: Focus moves correctly when drawer opens/closes
    When I open the drawer
    Then the focus should move into the drawer
    When I close the drawer
    Then the focus should return to the 'Filters' button

# UI / Layout Scenarios
Scenario: Drawer opens correctly on different viewport sizes
    Given the viewport is set to "<viewport>"
    When I open the drawer
    Then the drawer should be visible
    And it should not overlap critical UI elements

Examples:
    | viewport   |
    | desktop    |
    | tablet     |
    | mobile     |

Scenario: Drawer persists open/close state after page reload
    Given the viewport is set to "<viewport>"
    When I open the drawer
    And I reload the page
    Then the drawer should close

  Examples:
    | viewport   |
    | desktop    |
    | tablet     |
    | mobile     |
