Feature: Login with Login.gov Workflow
  As a user
  I want to sign in using Login.gov
  So that I can access my Simpler Grants account

  Background:
    Given I navigate to the Simpler Grants staging site

    @Login-LoginDotGov
    Scenario: Successful Login.gov authentication with MFA
        Given the user launches the application
        When the user clicks the "Sign in" button
        And the user enters a valid email and password
        And the user submits the login form
        And the user enters the authentication code
        And the user submits the MFA form
        Then the user is successfully logged in