# Shared failure path feature for all grant application forms
# Each form-specific failure spec file references this feature file.

Feature: Apply - Application Form Failure Path

  Background:
    Given the user is able to login with all roles needed
    And the system is available

  Scenario Outline: Application form completion failure path - <scenario slug>

    # Login
    Given the user is logged in

    # Navigate to opportunity page
    And the user launches the URL for an opportunity with an open competition

    # Start a new application
    When the user clicks "Start Application" in the opportunity page
    Then the "Start a new application" modal opens
    When the user selects "Organization A" in the "Who's applying" dropdown
    And the user enters the application name
    And the user clicks "Create Application"
    Then a new application is created

    # Open target form
    And the application landing page loads with the <form name> form link visible
    When the user opens the <form name> form

    # Trigger failure path save
    And the user attempts to save with <failure condition>

    # Validate error state
    Then required field validation errors are shown on the form
    When the user navigates back to the application landing page
    Then under the <form name> form the status shows "Some issues found"

    Examples:
      | scenario slug                        | form name                                   | failure condition                                 |
      | budget-narrative-attachment          | Budget Narrative Attachment                 | no file uploaded for required attachment fields   |
      | cd511                                | CD511                                       | required fields left empty                        |
      | epa-keycontacts                      | EPA Key Contacts                            | partial data entered with required fields missing |
      | epa4700-4                            | EPA Form 4700-4                             | required fields left empty                        |
      | grantsgov-lobbying                   | Grants.gov Lobbying                         | required fields left empty                        |
      | other-narrative-attachment           | Other Narrative Attachments                 | no file uploaded for required attachment fields   |
      | project-abstract-summary             | Project Abstract Summary                    | required fields left empty                        |
      | project-abstract                     | Project Abstract                            | required fields left empty                        |
      | project-narrative-attachment         | Project Narrative Attachment                | no file uploaded for required attachment fields   |
      | sf424                                | Application for Federal Assistance (SF-424) | required fields left empty                        |
      | sf424a                               | SF-424A                                     | required fields left empty                        |
      | sf424b                               | SF-424B                                     | required fields left empty                        |
      | sf424d                               | SF-424D                                     | required fields left empty                        |
      | sflll                                | SF-LLL                                      | required fields left empty                        |
      | suppcoversheet-neh-grantsprogram     | Supplementary Cover Sheet                   | required fields left empty                        |

  # Expected failure path form status on the application landing page:
  # "incomplete" -> displays "Some issues found"
