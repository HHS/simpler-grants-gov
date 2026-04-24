# @specFile search-download.spec.ts
# @featureArea Search
# @debugNote Validates CSV export trigger and filename pattern

Feature: Search Results CSV Download
  As a user on Search
  I want to export search results as CSV
  So that I can analyze results offline

  Background:
    Given I am on the Search Funding Opportunity page

  Scenario: Download CSV from search results
    When I click the search results export button
    Then a CSV file should download
    And the filename should match "grants-search-<timestamp>.csv"
