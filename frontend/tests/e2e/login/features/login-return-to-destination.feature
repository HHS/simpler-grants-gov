# @featureArea Authentication
# @specFile e2e/login/specs/login-return-to-destination.spec.ts
# @debugNote Local only: completes the round trip against the local mock Login.gov server, on Chromium. Starts on localhost because the local API returns to http://localhost:3000/api/auth/callback

Feature: Sign in returns to the original page
  As a signed-out user on a page that requires sign in
  I want signing in to bring me back to the page I was on
  So that I do not lose my place or the details in the page URL

  Background:
    Given I am signed out on "/workspace?utm_source=e2e&example=value"
    And I see that I am not signed in, with a "Sign in" button
    When I choose to sign in
    Then I reach the Login.gov sign-in page

  Scenario: signing in returns to the exact original pathname and query
    When I complete sign-in on Login.gov
    Then I return to "/workspace?utm_source=e2e&example=value"
    And I see the signed-in version of the page

  Scenario: browser Back from Login.gov returns to the original page, still signed out
    When I use the browser Back button
    Then I return to "/workspace?utm_source=e2e&example=value"
    And I see that I am not signed in, with a "Sign in" button
    And sign-in does not start again on its own
