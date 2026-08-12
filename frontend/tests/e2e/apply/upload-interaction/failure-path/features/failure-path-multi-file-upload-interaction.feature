# Feature: Multi file upload interactions - Failure Path
# Related spec: e2e/apply/upload-interaction/failure-path/specs/failure-path-multi-file-upload-interaction.spec.ts
# Scenario: Failure path - Other Narrative Attachment multi-file upload error handling
#
# Notes:
# - These scenarios verify that aborted and failed multi-file uploads do not save attachments.
# - They also verify the choose-from-folder action remains available after upload failure.

Feature: Multi file upload interactions - Failure Path
  Verify error handling for multi-file uploads on the Other Narrative Attachment form.

  Background:
    Given the user is authenticated
    And the user has opened an application for a valid opportunity

  Scenario: Abort a multi-file upload and keep the choose from folder link visible
    Given the user has opened the "Other Narrative Attachment" form
    When the upload request is aborted before completion
    And the user uploads a file
    Then no file is saved
    And the 'choose from folder' link remains visible

  Scenario: Failed multi-file upload keeps the choose from folder link visible
    Given the user has opened the "Other Narrative Attachment" form
    When the upload request fails
    And the user uploads a file
    Then no file is saved
    And the 'choose from folder' link remains visible
