Feature: File upload interactions - Happy Path
  Verify file upload behavior for application attachment forms.

  Background:
    Given the user is authenticated
    And the user has opened an application for a valid opportunity

  Scenario: Upload a single file and keep the multiple-file uploader visible
    Given the user has opened the "Other Narrative Attachment" form
    When the user uploads a single file
    Then the uploaded file is visible
    And the 'choose from folder' link remains visible
    And the delete action is available

  Scenario: Delete an uploaded file and restore the input
    Given the user has opened the "Other Narrative Attachment" form
    And a file has already been uploaded
    When the user deletes the uploaded file
    Then the choose from folder link is visible again

  Scenario: Upload multiple files on a multi-file input
    Given the user has opened the "Other Narrative Attachment" form
    When the user uploads more than one file
    Then both uploaded files are visible
    And the 'choose from folder' link remains visible

  Scenario: Hide the single-file input while upload is in progress
    Given the user has opened the "Project Abstract" form
    When the upload is stubbed as a streaming attachment
    And the user uploads a file
    Then upload status is displayed
    And the 'choose from folder' link is hidden

  Scenario: Single-file input must not allow multiple files
    Given the user has opened the "Project Abstract" form
    When the user inspects the file input
    Then the file input does not accept multiple files

  Scenario: Single-file input accepts only the first file when multiple are provided
    Given the user has opened the "Project Abstract" form
    When the test attempts to attach multiple files via the "choose from folder" link
    Then only the first file is uploaded
    And the 'choose from folder' link is hidden

  Scenario: Handle delete and restore behavior for single-file attachments
    Given the user has opened the "Project Abstract" form
    And the user has uploaded a file
    When the user deletes the uploaded file
    Then the choose from folder link becomes visible again

  Scenario: Delete one of two uploaded files with the same name and keep the other
    Given the user has opened the "Other Narrative Attachment" form
    And two files with the same filename are uploaded
    When the user deletes one file
    Then one file remains
    And the delete action remains available
    Given the user has opened the "Other Narrative Attachment" form
    And two files with the same filename are uploaded
    When the user deletes one file
    Then one file remains
    And the delete action remains available
