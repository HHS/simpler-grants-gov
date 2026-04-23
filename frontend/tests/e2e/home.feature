Feature: Home Page
 
  Background:
    Given the user navigates to the home page "/"
 
  # --- Title ---
 
  Scenario: Show the page title
    Then the page title should match "Simpler.Grants.gov"
 
  # --- External links ---
 
  Scenario: Clicking "Follow on GitHub" opens the repository in a new tab
    When the user clicks the "Follow on GitHub" link
    Then a new tab should open
    And the new tab URL should be "https://github.com/HHS/simpler-grants-gov"
 
  # --- Accessibility / keyboard navigation ---

  Scenario: Skip-to-main-content link is reachable by keyboard and scrolls past the gov banner
    Given the government banner is fully in the viewport
    When the user presses the Tab key
    Then the "Skip to main content" link should be focused
    When the user presses the Enter key
    Then the government banner should no longer be fully in the viewport
 
  # --- Mobile navigation ---

  Scenario: Mobile nav is hidden by default and opens when the menu button is clicked
    Given the viewport is set to a mobile width
    Then the primary navigation should contain 5 items
    And all primary navigation items should not be visible
    When the user opens the mobile nav menu
    Then the navigation element should have the class "is-visible"
    And all primary navigation items should be visible

  Scenario: Mobile nav closes when a navigation link is clicked
    Given the viewport is set to a mobile width
    And the mobile nav menu is open
    When the user clicks the first navigation link
    Then the first navigation link should not be visible
 
  Scenario: Mobile nav closes when the user clicks the overlay
    Given the viewport is set to a mobile width
    And the mobile nav menu is open
    Then the overlay should be visible
    When the user clicks the overlay
    Then the overlay should not be visible
    And the first navigation link should not be visible

  Scenario: Mobile nav closes when the viewport is resized above the breakpoint
    Given the viewport is set to a mobile width
    And the mobile nav menu is open
    When the viewport width is resized to 1025px
    Then the overlay should not be visible
    When the viewport width is resized back to 1023px
    Then the overlay should be visible

  Scenario: Mobile nav closes when the Escape key is pressed
    Given the viewport is set to a mobile width
    And the mobile nav menu is open
    When the user presses the Escape key
    Then the first navigation link should not be visible
    And the overlay should not be visible
