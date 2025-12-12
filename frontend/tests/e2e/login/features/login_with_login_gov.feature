Feature: Login with Login.gov Workflow
  As a user
  I want to sign in using Login.gov
  So that I can access my Simpler Grants account

  Background:
    Given I navigate to the Simpler Grants staging site

    @Login-LoginDotGov
    Scenario: Successful Login.gov authentication with MFA
        Given the user is logged in
