Feature: Opportunity Detail Navigation – Search Results Table
  As a user searching for funding opportunities
  I want to navigate to an Opportunity Detail page
  So that I can review full opportunity information

  Background:
    Given I am on the Search Funding Opportunity page
    And search results are displayed
    And my login state is "<loginState>"

  Examples:
    | loginState      |
    | logged in       |
    | not logged in   |

  Scenario: Navigate to detail page from different clickable entry points
    When I click the title for an opportunity in the results table
    Then I should be taken to the Opportunity Detail page
    And the URL should contain the selected opportunity identifier
    And the opportunity title displayed should match the selected result

  Scenario: Navigate to detail page from various result states
    Given I have applied "<stateType>" on the search results page
    When I click an opportunity title
    Then I should be taken to the correct Opportunity Detail page
    And the URL should contain the selected opportunity identifier

  Examples:
    | stateType      |
    | filters        |
    | sorting        |
    | pagination     |

  Scenario: Opportunity Detail page loads successfully
    When I navigate to an Opportunity Detail page
    Then the page should load without error
    And a loading indicator should appear while data is being fetched
    And the loading indicator should disappear once data loads
    And the opportunity title and identifier should be displayed

  Scenario: Direct URL access using link copied from search results
    Given I copy the link address from an opportunity title in the search results table
    When I navigate directly to that copied Opportunity Detail URL
    Then the corresponding Opportunity Detail page should load
    And the opportunity title should match the selected search result

  Scenario: Browser back returns user to Search Results page
    Given I navigate to an Opportunity Detail page
    When I press the browser back button
    Then I should return to the Search Results page

  Scenario: Search state is preserved after returning from detail page
    Given I have applied search keywords, filters, sorting, and navigated to page 2
    And I navigate to an Opportunity Detail page
    When I press the browser back button
    Then my search keywords should be preserved
    And my applied filters should remain selected
    And my sort order should be preserved
    And I should return to the same pagination page

  Scenario: Rapid repeated clicks do not cause incorrect navigation
    When I rapidly click an opportunity title multiple times
    Then I should be taken to a single correct Opportunity Detail page