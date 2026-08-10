Feature: File upload interactions - Failure Path
  Verify upload error handling for attachment forms.

  Background:
    Given the user is authenticated
    And the user has opened an application for a valid opportunity

  Scenario: Abort an upload and keep the choose from folder link visible
    Given the user has opened the "Other Narrative Attachment" form
    When the upload request is aborted before completion
    And the user uploads a file
    Then no file is saved
    And the 'choose from folder' link remains visible

  Scenario: Failed single-file upload keeps the choose from folder link visible
    Given the user has opened the "Project Abstract" form
    When the upload request fails
    And the user uploads a file
    Then an upload error is displayed
    And no file is saved
    And the 'choose from folder' link remains visible
