@6146

Feature: Application Workflow - Negative Path Scenarios
  The system should handle invalid inputs, errors, and unexpected user behavior
  by preventing progress and displaying meaningful error messages.

  ###########################################################################
        # Summary
        # To identify what is needed for E2E tests in the Simpler Apply workflow, we want to audit the existing workflow and develop a plan of priority E2E tests needed. We may not get a team of folks to do rigorous testing of forms and workflows in this quad, so we want to create some essential tests that can be used to catch risky errors.

        # Goal: What are the E2E tests (or other integrations) we should focus on building in Quad 4 that significantly reduces of our risk of breaking the Apply workflow unintentionally?

        # In evaluating user interactions, build test cases for each scenario and rank them by their importance to the proper functioning of the apply functionality. Test cases can be stored, for now, in google drive document or spreadsheet until we have a better place to put them

        # Acceptance criteria

        # Primary apply related user flows are documented as test cases and ranked in order of priority for testing
  ###########################################################################
  Background: Navigate to search page after login
    Given I click 'Search' tab
    When I enter 'MOCK PILOT - National Park Service (NPS)' at 'Search' field
    And I click 'Search' button
    And I click 'MOCK PILOT - National Park Service (NPS)' link from search results

  ###########################################################################
  # 1. Start Application – Shell Fails to Load
  ###########################################################################
  @negative @workflow @start
Scenario: Application shell fails to load when starting a new application
  Given the user is on the landing page
  When the user clicks the "Start new application" button
  Then the application shell fails to load
  And the user is shown an error state
  And an error message is displayed indicating the application could not be loaded
  # And the user sees the error message "Unable to load application. Please try again later."

  ###########################################################################
  # 2. Form Navigation – Data Lost or Fails to Navigate
  ###########################################################################
  @negative @workflow @navigation
Scenario: Form navigation retains data when moving between sections
  #Note: This scenario verifies that data entered in a form step is not lost when navigating back and forth between sections
  Given I navigate to the 'application form with multiple sections'
    |application form with multiple sections|
    |Application for Federal Assistance (SF-424)|
  And I am on section 1
  When I enter valid information in section 1
  And I navigate to section 2 using the navigation menu
  And I enter valid information in section 2
  And I navigate back to section 1 using the navigation menu
  Then the previously entered data in section 1 should be retained
  When I navigate to section 2 again using the navigation menu
  Then the previously entered data in section 2 should be retained

  ###########################################################################
  # 3. Required Field Validation – Empty Fields Block Save
  ###########################################################################
@negative @validation @workflow
Scenario: Required fields validation blocks saving incomplete form
  # This scenario verifies that the application prevents saving when required fields are missing
  # and that partially completed data is not persisted.

  Given the user is on a form step with multiple required fields

  When the user clicks the "Save" button without entering any data
  Then validation errors are displayed
  And an error message is shown for each required field
  And the form is not saved

  When the user enters valid data into required field_1
  And the user clicks the "Save" button
  Then validation errors are displayed for field_2 and field_3
  And a message is displayed indicating the form was not saved due to missing required fields
  And no partial data is saved

  When the user fills out all required fields except field_1
  And the user clicks the "Save" button
  Then a validation error is displayed for field_1
  And a message is displayed indicating the form was not saved due to missing required fields
  And no partial data is saved

  # ###########################################################################
  # # 4. Cross Form Required Validation – Missing Required Data at Submission
  # ###########################################################################
  # @negative @validation @submission @workflow
  # Scenario: Submission fails due to missing answers in other form
  #   Given the user skipped a required question in an earlier step
  #   When the user clicks Submit on the Review & Submit page
  #   Then submission fails
  #   And the user is redirected to the step with missing data
  #   And an error message is displayed

  ###########################################################################
  # 5. Successful Submission – Backend Submission Error
  ###########################################################################
  @negative @submission @workflow
  Scenario: Submission fails due to backend error
    Given the user has completed all required fields
    When the user clicks Submit
    Then the system displays "Submission failed"
    And the user stays on the review page

  ###########################################################################
  # 6. Data Persist on Refresh – Data Loss After Refresh
  ###########################################################################
  @negative @persistence @workflow
  Scenario: Data does not persist after page refresh
    When the user attempts to refresh the page
    Then a warning dialog is displayed about unsaved changes
    And the user can choose to stay on the page or continue

  # ###########################################################################
  # # 7. Save and Continue Later – Save Fails
  # ###########################################################################
  # @negative @saving @workflow
  # Scenario: Save and Continue Later fails
  #   Given the user has entered progress in the application
  #   When the user selects "Save and Continue Later"
  #   Then the system displays "Unable to save your progress"
  #   And a draft is not created

  # ###########################################################################
  # # 9. File Upload – Invalid File Rejected
  # ###########################################################################
  # @negative @upload @workflow
  # Scenario: User uploads invalid file type
  #   Given the user is on the file upload step
  #   When the user uploads a ".exe" file
  #   Then the system rejects the file
  #   And the user sees an error "Invalid file type"

  # ###########################################################################
  # # 12. Direct Step Bypass Prevention – Bypass Allowed
  # ###########################################################################
  # @negative @security @workflow
  # Scenario: User bypasses a required step using URL
  #   Given the user is on Form 1
  #   When the user manually browses to Form 2 via URL
  #   Then the system incorrectly loads Form 2
  #   And the bypass is not prevented

  ###########################################################################
  # 14. Task Creation – Task Fails to Create
  ###########################################################################
  @negative @task @workflow
  Scenario: Task is not created after submission
    Given the user completes the submission process
    When the system attempts to create the task
    Then no task is created
    And the system displays "Task creation failed"

  ###########################################################################
  # 15. Notification Email – Email Fails to Send
  ###########################################################################
  @negative @email @workflow
  Scenario: Notification email fails to send
    Given a task is created for the next user
    When the system attempts to send the notification email
    Then the email fails to send
    And an error is logged

  ###########################################################################
  # 16. Workflow Status – Status Fails to Load
  ###########################################################################
  @negative @status @workflow
  Scenario: Workflow status cannot be retrieved
    Given the user views the application summary
    When the system loads workflow status
    Then an error occurs
    And the user sees "Unable to load status"

  ###########################################################################
  # 17. Action History – History Fails to Load
  ###########################################################################
  @negative @history @workflow
  Scenario: Action history is missing or fails to load
    Given the user is viewing an application
    When the system loads the action history
    Then no history is displayed
    And the user sees "No history available" or an error message
