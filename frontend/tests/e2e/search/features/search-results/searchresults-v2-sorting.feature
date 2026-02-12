Feature: Search Results Sorting – General Behavior - Search Results Table
  As a user
  I want to sort search results using the "Sort by" dropdown
  So that results are ordered correctly, persistent, accessible, and page layout remains intact

Background:
  Given I am on the Search Funding Opportunity page
  And search results are displayed
  And my login state is "<loginState>"

Examples:
  | loginState      |
  | logged in       |
  | not logged in   |

# Sorting Behavior
Scenario: Selecting a sort option updates results
  When I open the "Sort by" dropdown
  And I select "<sortOption>" from the dropdown
  Then results should be reordered according to "<sortOption>"
  And results should update without a full page reload
  And the selected sort option should be reflected in the dropdown
  And the selected sort option reflects the intended sort direction (e.g., ascending or descending)
  And sorting persists when pagination changes
  And sorting works correctly with applied filters
  And sorting persists after saving the search if "<viewport>" is "desktop"
  And sorting persists when navigating to an Opportunity Detail page and back if "<viewport>" is "mobile"
  And sorting resets when a new search is performed
  And the dropdown is keyboard-navigable
  And screen readers announce the selected sort option
  And focus remains on the dropdown after selection

Scenario: Changing sort multiple times updates results each time
  When I select "<firstSortOption>"
  Then results should be updated according to "<firstSortOption>"
  When I select "<secondSortOption>"
  Then results should be updated according to "<secondSortOption>"
  And the dropdown should show "<secondSortOption>"

Scenario: Sort does not break layout with multiple filters applied
  Given multiple filters are applied
  When I select the sort option "<sortOption>"
  Then the page layout should remain correct
  And if "<viewport>" is "mobile" the filter drawer layout should not be broken
  And the sort dropdown should remain visible and functional

Scenario: Data integrity after sorting
  When I select "<sortOption>"
  Then results should be correctly ordered based on "<sortOption>"
  And sorting works correctly with large result sets
  And sorting works correctly with filtered results
  And sorting works correctly with partial result sets
  And sorting produces consistent ordering across pages

Scenario: Default sort and reset behavior
  Then results should be sorted by "Most relevant"
  When I perform a new search
  Then the sort option should reset to "Most relevant"

Scenario: Sort dropdown functions correctly with empty result sets
  Given there are no matching search results
  Then the page should remain stable and not break
  And the sort dropdown should be visible and functional
  When I select any sort option from the dropdown
  Then the selection should be reflected in the URL
  And no errors should occur
  And the page should remain stable

Examples:
  | loginState    | viewport  | sortOption                 | firstSortOption           | secondSortOption          |
  | logged in     | mobile    | Most relevant              | Close date (Furthest)     | Close date (Soonest)      |
  | logged in     | mobile    | Close date (Furthest)      | Posted date (Newest)      | Posted date (Oldest)      |
  | not logged in | mobile    | Close date (Soonest)       | Opportunity title (A to Z)| Opportunity title (Z to A)|
  | not logged in | mobile    | Posted date (Newest)       | Award minimum (Lowest)    | Award minimum (Highest)   |
  | logged in     | mobile    | Posted date (Oldest)       | Award maximum (Lowest)    | Award maximum (Highest)   |
  | logged in     | desktop   | Opportunity title (A to Z) | Most relevant             | Posted date (Newest)      |
  | not logged in | desktop   | Opportunity title (Z to A) | Close date (Furthest)     | Close date (Soonest)      |
  | not logged in | desktop   | Award minimum (Lowest)     | Award minimum (Highest)   | Award maximum (Lowest)    |
  | logged in     | desktop   | Award minimum (Highest)    | Award maximum (Lowest)    | Award maximum (Highest)   |
  | logged in     | desktop   | Award maximum (Lowest)     | Most relevant             | Posted date (Oldest)      |
  | not logged in | desktop   | Award maximum (Highest)    | Opportunity title (A to Z)| Opportunity title (Z to A)|