Feature: Newsletter subscription
  As a visitor
  I want to subscribe to the newsletter
  So I can get updates

  Background:
    Given I open "/newsletter"

  Scenario: Show the subscription page title
    Then the page title should match "Subscribe | Simpler.Grants.gov"

  Scenario: Show errors when submitting empty form
    When I click "Subscribe" button
    Then I should see 2 error messages
    And I should see "Please enter a name."
    And I should see "Please enter an email address."

  Scenario: Subscribe with valid name and email
    When I fill "First Name (required)" with "Apple"
    And I fill "Email (required)" with "name@example.com"
    And I click "Subscribe" button
    Then I should see "Subscribed" heading

  Scenario: Show error when subscription fails
    When I fill "First Name (required)" with "Apple"
    And I fill "Email (required)" with "name@example.com"
    And I click "Subscribe" button
    Then I should see 1 error message
    And I should see "An error occurred when trying to save your subscription."
