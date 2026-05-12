# @featureArea Roadmap
# @specFile e2e/roadmap.spec.ts
# @docSource documentation/wiki/product/product-roadmap.md

Feature: Product roadmap page
  As a member of the public
  I want to view the Simpler Grants roadmap information
  So I can understand current work and find the detailed GitHub roadmap

  Background:
    Given I open "/roadmap"

  Scenario: Show the roadmap page title
    Then the page title should be "Roadmap | Simpler.Grants.gov"

  Scenario: Return to top link works
    When I scroll to the bottom of the page
    And I click "Return to top"
    Then I should be back at the top
    And I should see "Product roadmap" heading in view

  Scenario: View all deliverables on GitHub
    When I click "View all deliverables on Github"
    Then I should stay on the roadmap page
    And a new tab should open
    And the new tab URL should be "https://github.com/orgs/HHS/projects/12/views/8"
