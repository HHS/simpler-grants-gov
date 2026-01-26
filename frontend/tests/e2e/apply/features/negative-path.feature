Feature: Application Workflow - Negative Path Scenarios

  ###########################################################################
# Negative test scenario cases feature file for primary Apply-related user flows #7673
  ###########################################################################
  Background: Navigate to search page after login
    Given I click 'Search' tab
    When I enter 'MOCK PILOT - National Park Service (NPS)' at 'Search' field
    And I click 'Search' button
    And I click 'MOCK PILOT - National Park Service (NPS)' link from search results

  ###########################################################################
  # 1. Start Application – Shell Fails to Load
  ###########################################################################
Scenario: Application shell fails to load when starting a new application
  Given the user is on the landing page
  When the user clicks the "Start new application" button
  Then the application shell fails to load
  And the user is shown an error state
  And an error message is displayed indicating the application could not be loaded
  And the user sees the error message "Unable to load application. Please try again later."

  ###########################################################################
  # 2. Successful Submission – Backend Submission Error
  ###########################################################################
  Scenario: Submission fails due to backend error
    Given the user has completed all required fields
    When the user clicks Submit
    Then the system displays "Submission failed"
    And the user stays on the application page

  ###########################################################################
  # 3. Save Fails
  ###########################################################################
  Scenario: Save fails
  Given the user has entered progress in the application
  When the user selects "Save"
  Then the system displays "Unable to save your progress"

  ###########################################################################
  # 4. File Upload – Invalid File Rejected
  ###########################################################################
  Scenario: User uploads invalid file type
  Given the user is on the file upload step
  When the user uploads a ".exe" file
  Then the system rejects the file
  And the user sees an error "Invalid file type"

  ###########################################################################
  # 5. Workflow Status – Status Fails to Load
  ###########################################################################
  Scenario: Application status cannot be retrieved
    Given the user views the application summary
    When the system loads workflow status
    Then an error occurs
    And the user sees "Unable to load application details"

