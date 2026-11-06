# @featureArea Authentication
# @specFile e2e/login/specs/login-redirect.spec.ts
# @debugNote Redirected to "/vision"

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
    Given I have stored "/vision" as the login redirect
    When I open the login page
    Then I am redirected to "/vision"

  Scenario: should redirect to home page when stored URL is empty
    Given I have stored "/" as the login redirect
    When I open the login page
    Then I am redirected to the home page

  Scenario: should redirect to home page when stored URL is external
    Given I have stored "https://external.com" as the login redirect
    When I open the login page
    Then I am redirected to the home page

  Scenario: should display "Redirecting..." text while redirecting
    Given I have stored "/vision" as the login redirect
    When I open the login page
    Then I see "Redirecting..."
    And I am redirected to "/vision"
