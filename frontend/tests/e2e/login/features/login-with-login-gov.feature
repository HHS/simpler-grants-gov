# @featureArea Authentication
# @specFile e2e/login/specs/login-with-login-gov.spec.ts
# @debugNote Mirrors the staging-only Login.gov MFA flow; existing-session handling lives in the login helper

Feature: Login.gov MFA authentication
  As a user
  I want to sign in with Login.gov
  So that I can access my Simpler Grants account

  Background:
    Given I navigate to the Simpler Grants staging site

  @Login-LoginDotGov
  Scenario: signs in with Login.gov MFA and reaches an authenticated state
    Given the user launches the application
    When the user clicks the "Sign in" button
    And the user enters a valid email and password
    And the user submits the login form
    And the user enters the authentication code
    And the user submits the MFA form
    Then the sign out button is visible
