Feature: Filter Drawer - Sort
  As a user
  I want the sort UI to appear in the correct location based on my device
  So that sorting behaves consistently while matching the intended layout

Background:
    Given I am on the Search Funding Opportunity page
    And my login state is "<loginState>"
    And the viewport is set to "<viewport>"
    And I open the filter drawer

Examples:
    | loginState    | viewport  |
    | logged in     | mobile    |
    | not logged in | mobile    |
    | logged in     | desktop   |
    | not logged in | desktop   |

# Mobile-specific behavior
Scenario: Sort dropdown appears in the filter drawer on mobile
  Given the viewport is set to "mobile"
  When I open the filter drawer
  Then the sort dropdown should be visible in the drawer
  And the sort dropdown should not be visible on the main search page

# Desktop-specific behavior
Scenario: Sort dropdown appears on the main search page on desktop
  Given the viewport is set to "desktop"
  Then the sort dropdown should be visible on the main search page
  And the sort dropdown should not be visible in the filter drawer

# Tablet behavior (if applicable)
Scenario: Sort dropdown placement on tablet
  Given the viewport is set to "tablet"
  Then the sort dropdown should appear on the main search page
  And the sort dropdown should not be visible in the filter drawer

# Drawer Interaction
Scenario: Drawer open/close does not affect selected sort
  When I select the sort option "<sortOption>"
  And I close the drawer if "<viewport>" is "mobile"
  And I reopen the drawer if "<viewport>" is "mobile"
  Then the sort dropdown should still show "<sortOption>"

Examples:
    | sort_option                 |
    | Most relevant               |
    | Close date (Furthest)       |
    | Close date (Soonest)        |
    | Posted date (Newest)        |
    | Posted date (Oldest)        |
    | Opportunity title (A to Z)  |
    | Opportunity title (Z to A)  |
    | Award minimum (Lowest)      |
    | Award minimum (Highest)     |
    | Award maximum (Lowest)      |
    | Award maximum (Highest)     |

# Drawer Layout validation
Scenario: Sort dropdown does not break drawer layout
  Given multiple filters are selected in the drawer
  When I select the sort option "<sortOption>"
  Then the drawer and page layout should not be broken