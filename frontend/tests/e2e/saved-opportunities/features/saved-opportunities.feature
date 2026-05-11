Feature: Saved Opportunities Page
  As a user
  I want to access my saved opportunities
  So that I can quickly revisit opportunities I'm interested in

  Background:
    Given the user navigates to the Simpler Grants Gov

  Scenario: Unauthenticated user accessing Saved Opportunities via direct URL
    Given the user is not logged in
    When the user navigates directly to the "/saved-opportunities" URL
    Then the page should display an alert heading with text "Not signed in"

  Scenario Outline: Logged-in user can access Saved Opportunities from the navigation menu
    Given the user is logged in
    And the viewport is set to "<viewport>"
    And the user opens the navigation menu if on mobile
    When the user clicks the "Workspace" dropdown button
    And the user clicks the "Saved opportunities" item in the Workspace dropdown
    Then the URL should contain "/saved-opportunities"
    And the page title should be "Saved Opportunities | Simpler.Grants.gov"

    Examples:
      | viewport |
      | desktop  |
      | mobile   |
