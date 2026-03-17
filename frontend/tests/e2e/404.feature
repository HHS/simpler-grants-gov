Feature: 404 page
  As a visitor
  I want a clear message when a page is missing
  So I can go back home

  Background:
    Given I open "/imnothere"

  Scenario: Show the 404 page title
    Then the page title should be "Oops, we can't find that page."

  Scenario: Show the link back home
    Then I should see "Home link" in "Page actions"
    And "Home link" in "Page actions" should have text "Visit our homepage"
