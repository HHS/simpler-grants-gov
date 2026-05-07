# @featureArea Search
# @specFile e2e/search/search-core/specs/search-download.spec.ts
# @debugNote Validates CSV export trigger and filename pattern
# Note: The CSV download functionality is not available on mobile devices.

Feature: Search Results CSV Download
  As a user on Search
  I want to export search results as CSV
  So that I can analyze results offline

  Background:
    Given I am on the "Search funding opportunity" page

/* @tags GRANTEE, OPPORTUNITY_SEARCH, CORE_REGRESSION */
  Scenario: Download CSV from search results on desktop devices
    When I click the search results export button
    Then a CSV file should download
    And the filename should match "grants-search-<timestamp>.csv"
