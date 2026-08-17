# Feature: File upload interactions - Failure Path
# Related spec: e2e/apply/upload-interaction/failure-path/specs/failure-path-single-file-upload-interaction.spec.ts
# Scenario: Upload error handling for Attachment single-file attachments
#
# Notes:
# - These scenarios verify that aborted and failed single-file uploads do not save attachments.
# - They also verify that the choose-from-folder action remains available after upload failure.

Feature: File upload interactions - Failure Path
  Verify error handling for single-file uploads on the Attachment form.

  Background:
    Given the user is authenticated
    And the user has opened an application for a valid opportunity

  Scenario: Abort a single-file upload and keep the choose from folder link visible
    Given the user has opened the "Attachment" form
    When the upload request is aborted before completion
    And the user uploads a file
    Then no file is saved
    And the 'choose from folder' link remains visible

  Scenario: Failed single-file upload keeps the choose from folder link visible
    Given the user has opened the "Attachment" form
    When the upload request fails
    And the user uploads a file
    Then no file is saved
    And the 'choose from folder' link remains visible
