Feature: Vision page
  As a visitor
  I want clear links to research pages
  So I can open the right pages in new tabs

  Background:
    Given I open "/vision"

  Scenario: Show the page title
    Then the page title should be "Vision | Simpler.Grants.gov"

  Scenario: Open the public wiki link in a new tab
    Given I should see "Read more about the research on our public wiki"
    When I scroll "Read more about the research on our public wiki" into view
    Then "Read more about the research on our public wiki" should have href "https://wiki.simpler.grants.gov/design-and-research/user-research/grants.gov-archetypes"
    When I click "Read more about the research on our public wiki"
    Then a new tab should open
    And the new tab URL should be "https://wiki.simpler.grants.gov/design-and-research/user-research/grants.gov-archetypes"

  Scenario: Open the user studies sign-up link in a new tab
    Given I should see "Sign up to participate in future user studies"
    When I scroll "Sign up to participate in future user studies" into view
    Then "Sign up to participate in future user studies" should have href "https://ethn.io/91822"
    When I click "Sign up to participate in future user studies"
    Then a new tab should open
    And the new tab URL should be "https://ethn.io/91822"
