Feature: Happy Path – Apply Workflow
  As a grant applicant
  I want to complete the full Apply workflow successfully
  So that I can submit a complete application without errors

  Background:
    Given the  user is able to login with all roles needed
    And the system is available

  @Happy-Path
  Scenario: Complete the full Apply workflow successfully

    # --- Login ---
    Given the user launches the URL
    When the user enters valid login credentials
    And the user logs in
    Then the user goes to the search page
    When the user searches for the specific Funding Opportunity number
    Then the user is taken to the Funding Opportunities page

    # --- Starting Application ---
    When the user clicks "Start Application"
    Then the "Start a new application" modal opens
    When the user selects a specific option in the "Who's applying" drop down
    And enters the name of the application
    And clicks on "Create Application" button
    Then a new workspace is created
    And the Apply page loads with navigation and header

    # --- Completing Required and Optional Forms ---
    Given there is one specific required form "SF-424"
    When the user completes all required fields in the SF-424 form
    And clicks on "Save"
    Then the system saves the SF-424 form

    Given there are conditionally required forms
    When the user completes all required fields in one of the optional forms
    And clicks on "Save"
    And selects "Yes" for the optional form filled
    And ensures remaining optional forms have "No" selected
    Then the system saves the optional form
    And the user is taken to the next required form or step

    # --- Save Behavior ---
    When the user clicks "Save" in the form
    Then no validation errors should appear

    # --- Uploading Documents ---
    When the user uploads all required documents under the "Attachment" header
    Then each file meets size and format requirements
    And the documents are successfully attached to the application
    And the uploaded files are listed in the "Attached document" table

    # --- Complete All Required Forms ---
    When the user completes all required forms
    Then all validations pass

    # --- Review Application ---
    When the user navigates to the Application page
    Then all sections display "No issues detected" where applicable

    # --- Submitting the Application ---
    When the user clicks "Submit application" with incomplete or invalid fields
    Then the system displays validation errors for the incomplete or invalid fields
    When the user fills all required fields and resolves all errors
    And the user clicks "Submit application"
    Then the system submits the application successfully

    # --- Confirmation Page ---
    Then the user is taken to the submission confirmation page
    And the user sees a confirmation message

    # --- Future development ---
    Then the user sees a confirmation number
    And the system displays the submission timestamp
    And a submission notification email is triggered
