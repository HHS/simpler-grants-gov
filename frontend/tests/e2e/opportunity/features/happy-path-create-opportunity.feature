# Feature: Opportunity - Happy Path
# Related spec: e2e/opportunity/specs/happy-path-create-opportunity.spec.ts
# Scenario: Happy path create opportunity draft
#
# ============== Notes for reviewer ===============================================
# - This scenario validates draft creation only (no publish flow).
# - Opportunity number and title use timestamp-based dynamic values.
# - The row-status assertion verifies the new opportunity appears as "Draft".
# ================================================================================

Feature: Opportunity happy path draft creation
  As a grantor user
  I want to create an opportunity draft
  So that I can confirm draft status on the opportunities list

  @GRANTOR
  Scenario: Happy path create opportunity draft
    Given I am authenticated as a grantor user
    And I use direct URL "/grantor/opportunities" to navigate to the "Opportunities List" page
    And I should be on the "Opportunities List" page

    When I click "Create Opportunity"
    And I should be on the "Create Opportunity" page
    And I enter the following values
      | Page Name               | Label                     | Field Type | Value                      |
      | Create Opportunity page | Opportunity number        | text       | Opp-mm-dd-yyyy-hh-mm-sec   |
      | Create Opportunity page | Opportunity title         | text       | Title-mm-dd-yyyy-hh-mm-sec |
      | Create Opportunity page | Grant selection method    | select     | Discretionary              |
      | Create Opportunity page | Assistance listing number | text       | 00.000                     |
    And I click "Save and continue" button

    Then I should be on the "Opportunity Overview" page
    And the URL should include "fromCreate=true"
    And I should see "Opportunity draft started" confirmation message
    And I should see the "Opportunity Summary" link
    And the "Preview" button should be disabled
    And the "Publish" button should be disabled

    When I navigate directly to "/grantor/opportunities"
    Then I should see "Draft" status for "Title-mm-dd-yyyy-hh-mm-sec"
    And the matching "Draft" opportunity row should be visible
