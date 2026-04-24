# @specFile search-error.spec.ts
# @featureArea Search
# @debugNote Covers invalid query error state and recovery path

Feature: Search Error Handling and Recovery
  As a user on Search
  I want invalid query states to be handled clearly
  So that I can recover and continue searching

  Scenario: Invalid status query shows error state
    Given I navigate to "/search?status=not_a_status"
    Then I should see an error alert on the page

  Scenario: Recover from error state by applying a valid filter
    Given I navigate to "/search?status=not_a_status"
    When I open the filters
    And I select the "Closed" opportunity status filter
    Then the URL should include "status=closed"
