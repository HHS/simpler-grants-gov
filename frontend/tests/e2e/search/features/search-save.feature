@4076
Feature: Save search to Workspace

# Summary
# As a follow up to building the save search feature, e2e tests should be written to verify all functionality
# Related to#4073
# Note: blocked until we can log in with the e2e test suite using login.gov (related tickets,#3459,#3793)
# Acceptance criteria
# Tests written to test:
# copy search to clipboard (can be done without auth)
# save search to account
# view saved searches in search page
# apply saved search from search page
# view saved searches in workspace page
# apply saved search from workspace page
# access workspace pages from navigation

# this background is used for scenarios that require login - implement platform to login steps in the step definitions
Background: Navigate to search page after login
    Given I click 'Search' tab
    And I enter 'K01 Mentored Research Scientist' at 'Search' field
    And I click 'Search' button
    And I see '9' at 'Search Results' section
        | results           |
        | 9                 |

@login @PendingAutomate
Scenario Outline: Verify copy clipboard
    When I click 'Copy' button
    And I see 'button'
        | button    |
        | 'Copied!' |
    And I see 'text' at dialog
        |text|
        |This search query was copied to your clipboard. Paste it as a link anywhere.|
    Then I see 'clipboard'
        | clipboard                                     |
        | /search?query=K01+Mentored+Research+Scientist |

@login @PendingAutomate
Scenario: Verify save search dialog elements
    When I click 'Save' button
    Then I see dialog displayed
    And I see 'text' at dialog
        | text                                                                   |
        | Save these search terms and filters with a name for easy access later. |
        | Name (required)                                                        |
    And I see 'field' at dialog
        | field |
        | Name  |
    And I see 'button' at dialog
        | button |
        | Save   |
        | Cancel |

@login @PendingAutomate
Scenario: Verify cancel save search
    And I click 'Save' button
    And I see dialog displayed
    And I 'type' 'field' in dialog
        | type        | field |
        | Test-1-Test | Name  |
    When I click 'Cancel' button
    And I click 'Workspace' tab
    Then I do not see 'Test-1-Test' on 'Workspace' page

@login @PendingAutomate
Scenario: Verify validation save search
    And I click 'Save' button
    And I see dialog displayed
    And I 'type' 'field' in dialog
        | type | field |
        |      | Name  |
    When I click on the "Save"
    Then I should see an alert with text "Please name this query."

@login @PendingAutomate
Scenario: Verify save search
    When I click 'Save' button
    And I see dialog displayed
    And I 'type' 'field' in dialog
        | type        | field |
        | Test-1-Test | Name  |
    And I click 'Save' button
    Then I see 'text' at dialog
        | text                      |
        | Query successfully saved. |
    And I see 'link' on dialog
        | link      |
        | Workspace |
    And I see 'text' at dialog
        | text                      |
        | Query successfully saved. |
    And I see 'button' at dialog
        | button |
        | Close  |

@login @PendingAutomate
Scenario: Verify workspace link in save search dialog
    And I click 'Save' button
    And I see dialog displayed
    And I 'type' 'field' in dialog
        | type                    | field |
        | Test-2-Test save search | Name  |
    And I click 'Save' button
    And I see 'link' on dialog
        | link      |
        | Workspace |
    When I click 'Workspace' link
    Then I navigated to "Saved search queries" page

@login @PendingAutomate
Scenario: Verify save search appears in workspace
    And I click 'Save' button
    And I see dialog displayed
    And I 'type' 'field' in dialog
        | type                    | field |
        | Test-2-Test save search | Name  |
    And I click 'Save' button
    And I see 'link' on dialog
        | link      |
        | Workspace |
    When I click 'Workspace' link
    Then I see "Test-2-Test save search" as a hyperlink

@login @PendingAutomate
Scenario: Verify saved search is loaded correctly
    And I click 'Save' button
    And I see dialog displayed
    And I 'type' 'field' in dialog
        | type                    | field |
        | Test-2-Test save search | Name  |
    And I click 'Save' button
    When I click 'Workspace' link
    And I click 'hyperlink'
        | hyperlink               |
        | Test-2-Test save search |
    Then I see 'search parameter' section populated
        | search parameter                |
        | K01 Mentored Research Scientist |
