/**
 * @featureArea Grantor
 * @feature Grantor opportunities list
 * @specFile e2e/grantor-opportunities.spec.ts
 * @description Validates agency-filtered opportunity rows, statuses, and grantor actions on the opportunities list page
 */

Subject:
Add E2E coverage for Grantor Opportunities list page (headers, status actions, and links)

Description:
Create and finalize Playwright Gherkin coverage for the Grantor Opportunities list page in grantor-opportunities.feature. The test should validate page title and heading, opportunities count and agency context text, table column names, row status visibility, status-based action behavior (Draft shows Edit/Copy/Delete; posted hides them), and expected navigation link patterns for Create Opportunity and Edit using placeholder-based route assertions.

Acceptance Criteria:
1. Header/context scenario verifies title, page name, count text, agency text, and Create Opportunity button.
2. Table structure scenario verifies Agency, Title, Status, and Actions column names.
3. Row/status scenario verifies expected agency/title/status values for listed rows.
4. Draft action scenario verifies Edit, Copy, and Delete are visible.
5. Posted action scenario verifies Edit, Copy, and Delete are not visible.
6. Navigation links scenario verifies:
   - Create Opportunity contains /grantor/opportunities/create?agency=<agencyID>
   - Edit contains /grantor/opportunity/<opportunityID>/edit
7. Feature file remains tagged and loop-friendly via Scenario Outline + Examples where appropriate.

Feature: Grantor opportunities list page
  As a grantor user
  I want to view opportunities filtered to my agency
  So that I can create and manage draft and posted opportunities

  Background:
    Given I open "/grantor/opportunities?agency=832df791-e397-4aab-8889-9b981b23db86"

  /* @tags GRANTOR, CORE_REGRESSION */
  Scenario Outline: Show opportunities title, heading, count, agency context, and create button
    Then the page title should be "Opportunities List"
    And I should see page name "Opportunities List"
    And I should see text "<Number of opportunities> opportunities"
    And I should see text "Showing opportunities for Agency for <Agency Name>"
    And I should see button "Create Opportunity"

    Examples:
      | Number of opportunities | Agency Name   |
      |                4        | AUTOIVAAKARS |

  /* @tags GRANTOR, CORE_REGRESSION */
  Scenario Outline: Show opportunities table column names
    Then I should see table name "Opportunities List"
    And I should see "<Column Name>"

    Examples:
      | Column Name |
      | Agency      |
      | Title       |
      | Status      |
      | Actions     |

  /* @tags GRANTOR, CORE_REGRESSION */
  Scenario Outline: Show expected opportunity row and status
    Then I should see "<agency>"
    And I should see "<title>"
    And I should see "<status>"

    Examples:
      | agency                    | title                                                                                                                                                                                                                                                                             | status |
      | Agency for AUTOIVAAKARS   | `1234567890-=[]\\;',./~!@#$%^&*()_+{}|:\"<>? `1234567890-=[]\\;',./~!@#$%^&*()_+{}|:\"<>? `1234567890-=[]\\;',./~!@#$%^&*()_+{}|:\"<>? `1234567890-=[]\\;',./~!@#$%^&*()_+{}|:\"<>? `1234567890-=[]\\;',./~!@#$%^&*()_+{}|:\"<>? `1234567890-=[]\\;',./~!@#$%^&*()_+{}_END | Draft  |
      | Agency for AUTOIVAAKARS   | Test                                                                                                                                                                                                                                                                              | posted |
      | Agency for AUTOIVAAKARS   | Test2                                                                                                                                                                                                                                                                             | posted |
      | Agency for AUTOIVAAKARS   | Test                                                                                                                                                                                                                                                                              | Draft  |

  /* @tags GRANTOR, FULL_REGRESSION */
  Scenario Outline: Show draft management actions
    Then I should see "Draft"
    And I should see "<Action>"

    Examples:
      | Action |
      | Edit   |
      | Copy   |
      | Delete |

  /* @tags GRANTOR, FULL_REGRESSION */
  Scenario Outline: Hide management actions for posted opportunities
    Then I should see "posted"
    And I should not see "<Action>"

    Examples:
      | Action |
      | Edit   |
      | Copy   |
      | Delete |

  /* @tags GRANTOR, FULL_REGRESSION */
  Scenario Outline: Show expected navigation links
    Then the "<label>" link should contain "<hrefContains>"

    Examples:
      | label              | hrefContains                                         |
      | Create Opportunity | /grantor/opportunities/create?agency=<agencyID>      |
      | Edit               | /grantor/opportunity/<opportunityID>/edit            |

  /* @tags GRANTOR, FULL_REGRESSION */
  Scenario: Happy path to creaete opportunity

    Then the URL should contain "/grantor/opportunities/create?agency=832df791-e397-4aab-8889-9b981b23db86"
    //Note: Navigate directly to the page until the link to create opportunities is implimented
    And I should see page name "Create opportunity"
    When I click "Create Opportunity" button
    Then I should see page name "Create Opportunity"
    And I enter "Test-2026-QC-"+"Autogenerate date and time" in the "Opportunity number" field
    And I enter "Title of test data" in the "Opportunity title" field
    //And I select "AUTOIVAAKARS" from the "Agency" dropdown
    //Note: Dropdown list with agency names
    And I select "Discretionary" from the "Funding instrument" dropdown
    //Note: -Select-,Discretionary,Mandatory,Continuation,Earmark,Other
    And I enter "00.000" in the "Assistance listing number" field
    When I click "Save and continue" button
    Then I should see page name: "Opportunity #:"
    //Note: the # should be fix to be "Number"

    And I enter "Up to $500,000" in the "Award amount" field
    And I enter "2026-08-01" in the "Open date" field
    And I enter "2026-10-15" in the "Close date" field
    And I enter "Support local community health initiatives" in the "Summary" field
    And I click "Save draft"
    Then I should see text "Draft"