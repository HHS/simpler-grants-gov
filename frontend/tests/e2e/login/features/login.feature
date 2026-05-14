# @featureArea Authentication
# @specFile e2e/login/specs/login.spec.ts
# @debugNote Mirrors e2e/login/specs/login.spec.ts

Feature: Login page redirect behavior
  As a user
  I want the login page to redirect me correctly
  So that I can return to the page I intended to visit

  Background:
    Given I navigate to the Simpler Grants site

  Scenario: should redirect to home page when no redirect URL is stored
    When I open the login page
    Then I am redirected to the home page

  Scenario: should redirect to stored URL after login
    Given I have stored "/opportunities" as the login redirect
    When I open the login page
    Then I am redirected to "/opportunities"

  Scenario: should redirect to home page when stored URL is empty
    Given I have stored "/" as the login redirect
    When I open the login page
    Then I am redirected to the home page

  Scenario: should redirect to home page when stored URL is external
    Given I have stored "https://external.com" as the login redirect
    When I open the login page
    Then I am redirected to the home page

  Scenario: should display "Redirecting..." text while redirecting
    Given I have stored "/opportunities" as the login redirect
    When I open the login page
    Then I see "Redirecting..."
    And I am redirected to "/opportunities"
