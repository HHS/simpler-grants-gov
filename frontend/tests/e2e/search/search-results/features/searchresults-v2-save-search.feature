Feature: Save Search Button – Search Results Table
  As a logged-in user
  I want to save my search criteria
  So that I can access it later

Background:
  Given I am on the Search Funding Opportunity page
  And my login state is "<loginState>"

Examples:
  | loginState      |
  | logged in       |
  | not logged in   |

Scenario: Save button visibility based on login state
  Then the "Save" button should be "<visibility>"

Examples:
  | loginState   | visibility          |
  | logged in    | visible             |
  | not logged in| not visible         |

Scenario: Save button appears even when there are no search results
  Given I am logged in
  And search results are empty
  Then the "Save" button should be displayed

Scenario: Save button remains visible after filters, sorting, and pagination
  Given I am logged in
  When I apply filters
  And I sort the results
  And I navigate to page 2
  Then the "Save" button should still be displayed

Scenario: Save a search and verify applied criteria appear in the workspace
  Given I am logged in
  And I apply "<Criteria Type>" using "<Value 1>" "<Operator>" "<Value 2>" on the Search page
  When I click the "Save" button
  Then the "Name this search query" modal should be displayed
  When I enter a new search name "E2E Save Search - Unique"
  And I click "Save" in the modal
  Then a confirmation modal should appear with text "Query successfully saved"
  And the modal should include a link to "Workspace"
  When I click the "Workspace" link in the confirmation modal
  Then I should be navigated to the Saved Search Queries page
  And I should see "E2E Save Search - Unique" listed
  And the saved search should reflect the applied "<Criteria Type>" using "<Value 1>" "<Operator>" "<Value 2>"
  And other existing saved searches should remain unchanged

Examples:
  | Criteria Type       | Value 1                                   | Operator | Value 2        |
  | Keyword             | health equity                             |          |                |
  | Agency              | Department of Health and Human Services   |          |                |
  | Status              | Open                                      |          |                |
  | ALN                 | 93.847                                    |          |                |
  | Sort                | Closing date: soonest first               |          |                |
  | Query with operator | health                                    | AND      | equity         |
  | Query with operator | mental                                    | OR       | substance use  |

Scenario: Save search modal prevents saving without a name
  Given I am logged in
  When I click the "Save" button
  Then the "Name this search query" modal should be displayed
  When I attempt to save without entering a search name
  Then the search should not be saved
  And no success confirmation should be displayed

Scenario: Clicking outside the save search modal closes it without saving
  Given I am logged in
  When I open the save search modal
  And I click outside the modal
  Then the save search modal should close
  And the search should not be saved

Scenario: Canceling save modal does not persist search
  Given I am logged in
  When I open the save search modal
  And I click cancel
  Then the search should not be saved

Scenario: Saved search restores query, filters, sort order, and resets pagination
  Given I have saved a search with keywords, filters, and sort order
  When I reopen the saved search
  Then the search query should be restored
  And filters should be restored
  And sort order should be restored
  And pagination should reset to page 1

Scenario: Saving a search does not trigger full page reload
  Given I am logged in
  When I save a search
  Then the page should not fully reload

Scenario: Search state is preserved when user logs in mid-search
  Given I am not logged in
  And I have applied filters and sorting
  And I am on page 3 of the results
  When I initiate login
  And I complete the login process
  And I return to the Search Funding Opportunity page
  Then the previously applied filters should remain
  And the previously selected sort order should remain
  And I should remain on page 3
  And the search results should reflect the previously applied criteria

Scenario: Save button and modal accessibility
  Given I am logged in
  When I focus on the "Save" button via keyboard
  Then the button should be focusable
  When I open the save search modal using keyboard
  Then I should be able to submit using Enter
  And the modal and button should be announced to screen readers

Scenario: Save modal responsive layout
  Given I am on a "<viewport>" viewport
  And I am logged in
  When I open the save search modal
  Then the modal layout should adjust correctly

Examples:
  | viewport  |
  | desktop   |
  | tablet    |
  | mobile    |

# --- reported as issue 8063 ---
Scenario: Error displayed when search name is a duplicate
  Given I am logged in
  And a saved search with name "<savedSearch>" exists
  When I attempt to save a new search with the same name "<savedSearch>"
  Then I should see an error message indicating the name already exists

# --- reported as issue 8045 ---
Scenario: Saved search selection resets when navigating via top Search menu
  Given I am logged in
  And I have selected a saved search "<savedSearch>"
  When I navigate to the Search page via the top navigation menu
  Then the saved search dropdown should reset to "Select saved query"
  And filters should be cleared
  And search results should reset to default
  When I attempt to reselect "<savedSearch>"
  Then the saved search should be reapplied immediately
  And the results should update according to the selected saved search

# --- reported as issue 8052---
Scenario: Saved search dropdown consistently reflects the applied selection
  Given I am logged in
  And I have selected a saved search "<firstSavedSearch>"
  Then the dropdown should show "<firstSavedSearch>" as selected
  When I select a different saved search "<secondSavedSearch>"
  Then the dropdown should show "<secondSavedSearch>" as selected
  When I select another saved search "<thirdSavedSearch>"
  Then the dropdown should show "<thirdSavedSearch>" as selected
  # Repeatable behavior check (alternate selection test)
  When I reselect "<secondSavedSearch>"
  Then the dropdown should show "<secondSavedSearch>" as selected

# --- reported and awaiting confirmation on expected behavior ---
# --- Per reviewer comment this may belong in Search feature instead of Save Search --- 
# --- Commented out for future discussion ---
# Scenario: Clicking Search without modifying criteria re-runs the saved search
#  Given I am logged in
#  And I have selected a saved search "<firstSavedSearch>"
#  And I have not modified the search criteria
#  When I click the Search button next to the search input field
#  Then the search results should refresh using the saved search criteria
#  And the saved search dropdown should remain "<firstSavedSearch>"