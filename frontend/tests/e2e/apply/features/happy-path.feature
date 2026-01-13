Feature: Happy Path – Apply Workflow
  As a grant applicant
  I want to complete the full Apply workflow successfully
  So that I can submit a complete application without errors

  Background:
    Given the user is able to login with all roles needed
    And the system is available

  @Happy-Path
  Scenario: Complete the Apply workflow for an Organization user
    
    # --- Login ---
    Given the user is logged in

    # --- Search the Opportunity ---
    When the user searches for an open funding opportunity

    # --- Starting Application ---
    When the user clicks "Start Application"
    Then the "Start a new application" modal opens
    When the user selects "Organization A" in the "Who's applying" dropdown
    And the user enters the application name
    And the user clicks "Create Application"
    Then a new application is created
    And the Application landing page loads with navigation, header, and a list of required and optional forms

    # ---- Completing Required Forms ---
    Given the user has completed the Required forms

    # ---- Completing Conditionally Required Forms ---  
    Given the user has completed the conditionally Required forms

    # --- Confirm the Optional Form for Submission ---
    Given the user has confirmed the optional Form for Submission

    # --- Validate All Required and Optional Forms ---
    Given the required and optional forms contain no validation errors

    # --- Complete Additional Attachments ---
    Given the user uploads additional attachments

    # --- Submitting the Application ---
    Given the user submits the application

    # --- Confirmation Page ---
    Then the user validates the confirmation page

  @Happy-Path
  Scenario: Complete the Apply workflow for an Individual user
    
    # --- Login ---
    Given the user is logged in

    # --- Search the Opportunity ---
    When the user searches for funding opportunity

    # --- Starting Application ---
    When the user clicks "Start Application"
    Then the "Start a new application" modal opens
    When the user does not select anything in the "Who's applying" dropdown
    And the user enters the application name
    And the user clicks "Create Application"
    Then a new application is created
    And the Application landing page loads with navigation, header, and a list of required and optional forms

    # ---- Completing Required Forms ---
    Given the user has completed the Required forms

    # ---- Completing Conditionally Required Forms ---  
    Given the user has completed the conditionally Required forms

    # --- Confirm the Optional Form for Submission ---
    Given the user has confirmed the optional Form for Submission

    # --- Validate All Required and Optional Forms ---
    Given the user completes validation of Required and Optional Forms

    # --- Complete Additional Attachments ---
    Given the user completes the additional attachments

    # --- Submitting the Application ---
    Given the user submits the application

    # --- Confirmation Page ---
    Then the user validates the confirmation page

# =================================================================
# --- Shared Workflow Details ---
# =================================================================

# --- Search the Opportunity ---
When the user goes to the search page
And the user searches for the specific Funding Opportunity number
Then the user scrolls to the search results table
When the user clicks the Funding Opportunity number
Then the user is taken to the Funding Opportunity details page

#---- Completing Forms (Required or Conditionally Required) ---
Given there are forms in the application forms list
When the user clicks on a form
Then the form opens
And the user completes all required fields

#--- Uploading Attachments (if present) ---
When the user uploads a file in any available attachment field
And the user clicks "choose from folder" or drags and drops the file
Then the file is successfully attached and appears in the appropriate attachment table

#--- Saving the Form ---
And the user clicks "Save"
Then no validation errors should appear
And the system saves the form

#--- Returning to Application Landing Page ---
When the user clicks on the Application Name link
Then the system navigates back to the Application landing page

# --- Confirm the Optional Form for Submission ---
When the user scrolls down to the "Conditionally-Required forms" section
And under "Submit with application" the user selects "Yes" for the completed optional form
Then no validation errors should appear
And remaining optional forms have "No" selected

# --- Validate All Required and Optional Forms ---
When the user completes all required and optional forms
Then all required and optional forms have no validation errors

# --- Attachment Uploads From the Attachment Section ---
When the user uploads all required documents under the "Attachment" header
Then the documents are successfully attached
And the uploaded files appear in the "Attached documents" table

# --- Submitting the Application ---
When the user clicks "Submit application" with incomplete or invalid fields
Then the system displays validation errors
When the user resolves all errors
And the user clicks "Submit application"
Then the system submits the application successfully

# --- Confirmation Page ---
Then the user is taken to the submission confirmation page
And the user sees a confirmation message

# =================================================================
# --- Future Development (Out of Scope for Current Testing) ---
# =================================================================

# --- Submission Confirmation Enhancements ---
# And the user sees a confirmation number
# And the system displays the submission timestamp
# And a submission notification email is triggered
