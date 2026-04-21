# Shared happy path feature for all 16 grant application forms.
# Each form-specific spec file references this feature file.
 
Feature: Apply - Application Form Happy Path
 
  Background:
    Given the user is able to login with all roles needed
    And the user navigates to the opportunity page for the form
 
  Scenario: Application form completion happy path - <form name>

    Given the user is logged in
    And the user launches the URL "https://<targetEnv>/opportunity/<opportunity_id>"
    When the user clicks "Start Application"
    Then the "Start a new application" modal opens

    When the <user type> selects <who is applying> in the "Who's applying" dropdown
    And the user enters the application name
    And the user clicks "Create Application"

    Then a new application is created
    And the user verifies the <form name> form link is visible

    When the user fills out the <form name> form with valid test data
    And the user clicks Save

    Then the form returns the message "Form was saved No errors were detected"
    
    When the user navigates back to the application landing page
    Then under the <form name> form the status shows "No issues detected"
    
    Examples:
      | user type    | who is applying            |
      | Organization | Organization A             |
      | Individual   | As an individual (myself)  |
      
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
 
  # Expected happy path form status on the application landing page:
  # "complete"   -> displays "No issues detected"
 