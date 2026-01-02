Feature: Filter Drawer - What-If Facets
  As a user
  I want "what-if" facets to update results and counts correctly
  So that I can explore opportunities and see potential results

  Background:
    Given I am on the Search Funding Opportunity page

  Scenario: Selecting a single what-if facet updates results
    When I select one of Funding Instrument type
    Then the results should update accordingly
    And facet counts for other what-if facets should update

  Scenario: Selecting multiple what-if facets updates results correctly
    When I select one or more Funding Instrument types
    And I select one or more Eligibility types
    Then the results should reflect all selections
    And facet counts for remaining what-if facets should update

  Scenario: Removing a what-if facet restores counts and results
    Given I have selected one or more Funding Instrument types and one or more Eligibility types
    When I deselect one of the selected facets
    Then the results should update accordingly
    And facet counts should reflect the remaining selections

  Scenario: Selecting overlapping Closing Date ranges
    When I select two or more Closing Date ranges
    Then the results should reflect the union of the selected ranges
    And facet counts should update accordingly

  Scenario: Handling null/empty facet values
    When I select a facet that has empty/null values
    Then results should not break
    And counts should display correctly
