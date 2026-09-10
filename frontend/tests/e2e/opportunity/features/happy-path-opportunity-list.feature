# Feature: Opportunity List Page - Happy Path
# Related spec: e2e/opportunity/specs/happy-path-opportunities-list.spec.ts
# Scenario: Grantor opportunities list page UI
#
# ============== Notes for reviewer ===============================================
# - This scenario validates the Opportunities List page UI for a grantor user.
# - Key page elements expected to be visible:
#   - Opportunities List heading
#   - Opportunities count
#   - Create Opportunity link
#   - Opportunities table
#   - Title, Status, and Action column headers
#   - Page 1 pagination button
#   - Next pagination button
# - The Create Opportunity link is expected to point to the create opportunity route.
# ================================================================================

Feature: Opportunity list page happy path
  As a grantor user
  I want to view the opportunities list page
  So that I can view existing opportunities and access opportunity management actions

  @GRANTOR
  Scenario: Grantor opportunities list page UI
    Given I am authenticated as a grantor user
    And I navigate to the "Opportunities List" page

    Then I should be on the "Opportunities List" page
    And I should see the opportunities list heading
    And I should see the opportunities count
    And I should see the "Create Opportunity" link
    And the "Create Opportunity" link should point to the create opportunity page
    And I should see the opportunities table
    And I should see the "Title" column header
    And I should see the "Status" column header
    And I should see the "Action" column header
    And I should see the "Page 1" pagination button
    And I should see the "Next" pagination button
