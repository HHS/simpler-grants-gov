Feature: Roadmap page
  As a visitor
  I want the roadmap page to work across devices
  So I can navigate and find information about Simpler Grants deliverables

  Background:
    Given I open "/roadmap"

  Scenario: Show the page title
    Then the page title should be "Roadmap | Simpler.Grants.gov"

  Scenario: Return to top link works
    When I scroll to the bottom of the page
    And I click "Return to top"
    Then I should be back at the top
    And I should see "Product roadmap" heading in view

  Scenario: View all deliverables on Github
    When I click "View all deliverables on Github"
    Then I should stay on the roadmap page
    And a new tab should open
    And the new tab URL should be "https://github.com/orgs/HHS/projects/12/views/8"
