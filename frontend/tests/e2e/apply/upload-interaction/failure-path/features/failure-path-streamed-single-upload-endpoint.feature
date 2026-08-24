# Feature: File Upload Interactions - Failure Path
# Related spec: e2e/apply/upload-interaction/failure-path/specs/failure-path-streamed-single-upload-endpoint.spec.ts
# Scenario: Upload error handling for single-file attachment uploads.
#
# ============== Notes for reviewer ===============================================
# - This feature validates failure handling for single-file attachment uploads.
# - The scenarios cover three upload failure conditions:
#   - Upload request is aborted before completion.
#   - Upload request fails before completion.
#   - Upload of a zero-byte file fails.
# - In all failure conditions:
#   - The selected file should not be saved.
#   - An error dismissal control should be visible.
# ================================================================================

Feature: Single file upload interactions failure path
  As an applicant
  I want the attachment form to handle upload failures correctly
  So that I can dismiss the error and try uploading the file again

  Scenario: Streamed single upload aborted does not save the file
    Given I am authenticated as an applicant
    And I have opened the "Attachment Form"

    When the attachment upload request is aborted before completion
    And I upload a file to the single-file attachment field

    Then the uploaded file should not be saved
    And I should see 0 uploaded files
    And the "Dismiss" button should be visible

  Scenario: Streamed single upload failure does not save the file
    Given I am authenticated as an applicant
    And I have opened the "Attachment Form"
    And the attachment upload request is forced to fail

    When I upload a file to the single-file attachment field

    Then the uploaded file should not be saved
    And I should see 0 uploaded files
    And the "Dismiss" button should be visible

  Scenario: Streamed single upload of a zero-byte file does not save the file
    Given I am authenticated as an applicant
    And I have opened the "Attachment Form"

    When I upload a zero-byte file to the single-file attachment field

    Then the uploaded file should not be saved
    And I should see 0 uploaded files
    And the "Dismiss" button should be visible
