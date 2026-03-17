Feature: Sign in
  As a visitor
  I want to sign in from the homepage
  So I can access my account

  Background:
    Given I open the homepage

  Scenario: Complete sign in flow
    When I click the sign-in button
    And I continue with sign-in
    And I enter my username
    And I submit the login
    Then I should be logged in
    And I should see my email in the user menu
