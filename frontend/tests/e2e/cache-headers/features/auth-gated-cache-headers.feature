Feature: Cache and index headers
  As the site operator
  I want auth-gated pages to never be publicly cached or indexed
  So that user-specific pages stay private while public pages stay cached

  Scenario: Auth-gated pages are private and noindex whether signed in or signed out
    When I request an auth-gated page
    Then the response is private, not stored, and marked noindex

  Scenario: Signed-out public pages keep their public cache policy
    When I request "/search" or "/opportunity/123" without a session
    Then the response keeps its public cache policy and is not marked noindex

  Scenario: Signed-in public pages are not stored
    When I request "/search" or "/opportunity/123" with a session
    Then the response is not stored and is not marked noindex

  Scenario: Old saved and applications paths land on private workspace pages
    When I request "/applications" or "/saved-opportunities"
    Then I am redirected to a private, noindex workspace page
