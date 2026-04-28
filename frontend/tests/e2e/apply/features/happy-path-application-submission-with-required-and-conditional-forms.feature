##
# @feature Apply - Happy Path – Application Submission Workflow (Required & Conditional Forms)
# @spec frontend/tests/e2e/apply/happy-path-application-submission-with-required-and-conditional-forms.spec.ts
# @description Complete the Application Submission workflow for an Organization or Individual user, including required and conditional forms

Feature: Application Submission Workflow with Required and Conditional Forms
  As a grant applicant
  I want to complete and submit an application with both required and conditional forms
  So that my application meets all requirements and is successfully submitted

  Scenario Outline: Complete the Application Submission workflow for an <user type> user, including required and conditional forms
    Given the user is authenticated as an <user type>
    And the user starts a new application for the specified opportunity
    And the Application landing page loads with the SF-424B form link visible
    When the user fills out and saves the SF-424B form
    Then a save success alert is shown for SF-424B
    And the application page shows the SF-424B form row as "No issues detected" and status "complete"
    When the user selects "Yes" to include the SF-LLL form in the submission
    And the user fills out and saves the SF-LLL form
    Then a save success alert is shown for SF-LLL
    And the application page shows the SF-LLL form row as "No issues detected" and status "complete"
    When the user submits the application
    Then a submission success confirmation is displayed

    Examples:
      | user type    |
      | Organization |
      | Individual   |
