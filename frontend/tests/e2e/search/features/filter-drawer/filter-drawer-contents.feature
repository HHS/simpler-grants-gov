Feature: Filter Drawer Contents
  As a user
  I want to see all expected filters in the drawer
  So that I know what filtering options are available

Background:
  # Common login state for all scenarios
  Given I am on the Search Funding Opportunity page
  And my login state is "<loginState>"

Examples:
    | login state   |
    | logged in     |
    | not logged in |

Scenario: Filter drawer displays all expected filter types
  When I open the filter drawer
  Then I should see the following filters in the drawer:
    | Filter Type           |
    | Opportunity Status    |
    | Funding Instrument    |
    | Eligibility           |
    | Agency                |
    | Category              |
    | Closing Date Range    |
    | Cost Sharing          |
  And each filter section should be visible to the user

Scenario: Filter sections can be collapsed and expanded
  When I open the filter drawer
  And I collapse a filter section
  Then the section should collapse
  When I expand the same filter section
  Then the section should expand
  And previously selected options should remain selected

Scenario: Long filter lists remain scrollable
  When I open the filter drawer
  And a filter with a long list of options
  Then the filter list should allow scrolling

Scenario: Filters with null/empty values handled gracefully
  When I open the filter drawer
  And I select a filter option with null or empty values
  Then the results should update without error
  And counts should display correctly

Scenario: Selecting a filter updates results (drawer-specific behavior)
  When I open the filter drawer
  And I select one or more filter options
  Then the results should update accordingly

Scenario: Filters with zero matching results are displayed correctly
  When I open the filter drawer
  And a filter option has zero matching opportunities
  Then the filter option should be visible but greyed out or disabled

Scenario: Drawer sections maintain expanded/collapsed state on reopen
  When I open the filter drawer
  And I collapse a filter section
  And I close the drawer
  And I reopen the drawer
  Then the previously collapsed section should remain collapsed

Scenario: Drawer content remains consistent across viewports
  Given I open the drawer in "<viewport>"
  Then all filter sections and options should be visible
  And the drawer layout should not overlap or hide other UI elements

Examples:
  | viewport  |
  | desktop   |
  | tablet    |
  | mobile    |

Scenario: Drawer is accessible via keyboard
  When I focus on the drawer toggle button
  And I navigate using Tab
  And I activate the drawer using "<key>"
  Then the drawer should open or close accordingly

Examples:
  | key   |
  | Enter |
  | Space |