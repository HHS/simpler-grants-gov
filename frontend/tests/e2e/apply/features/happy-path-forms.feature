# Shared happy path feature for all 16 grant application forms.
# Each form-specific spec file references this feature file.
 
Feature: Apply - Application Form Happy Path
 
  Background:
    Given the user is able to login with all roles needed
    And the user navigates to the opportunity page for the form
 
  Scenario: Application form completion happy path - <form name>

    Given the user is logged in
    And the user launches the URL "https://<targetEnv>/opportunity/<opportunity_id>
    When the user creates a new application for their organization
    And the user verifies the <form name> form link is visible
    And the user fills out the <form name> form with valid test data
    And the user clicks Save
    Then the form returns the message "Form was saved No errors were detected"
    When the user navigates back to the application landing page
    Then under the <form name> form the status shows "No issues detected"
 
    Examples:

      | form name                          |
      | SF424                              |
      | SF424A                             |
      | SF424B                             |
      | SF424D                             |
      | SF-LLL                             |
      | CD511                              |
      | EPA Form 4700-4                    |
      | EPA Key Contacts                   |
      | Grants.gov Lobbying                |
      | Project Abstract                   |
      | Project Abstract Summary           |
      | Project Narrative Attachments      |
      | Other Narrative Attachments        |
      | Budget Narrative Attachment        |
      | Supplemental Cover Sheet NEH       |
      | Attachments                        |
 
  # Expected form statuses on the application landing page:
  # "complete"   → displays "No issues detected"
 