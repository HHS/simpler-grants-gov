# Feature: Opportunity Overview - Happy Path
# Related spec: e2e/opportunity/specs/happy-path-opportunity-overview-initial-state.spec.ts
# Scenario: Happy path opportunity overview initial state
#
# ============== Notes for reviewer ===============================================
# - This scenario validates initial overview state immediately after creating a draft.
# - Key status expectations in initial state:
#   - Opportunity Summary: Not started
#   - Application Package: Not started
# - Preview and Publish actions are expected to be disabled.
# ================================================================================

Feature: Opportunity overview happy path initial state
  As a grantor user
  I want to view the initial overview state of a newly created opportunity
  So that I can confirm section statuses and action gating before any edits

  @GRANTOR
  Scenario: Happy path opportunity overview initial state
    Given I am authenticated as a grantor user
    And I create a new opportunity with happy-path data

    Then I should be on the "Opportunity Overview" page
    And I should see "Opportunity Summary" status as "Not started"
    And I should see "Application Package" status as "Not started"
    And the "Preview" button should be disabled
    And the "Publish" button should be disabled
