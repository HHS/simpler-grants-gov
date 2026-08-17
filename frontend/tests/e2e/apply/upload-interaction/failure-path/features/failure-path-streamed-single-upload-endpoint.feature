# Feature: File Upload Interactions - Failure Path
# Related spec: e2e/apply/upload-interaction/failure-path/specs/failure-path-streamed-single-upload-endpoint.spec.ts
# Scenario: Upload error handling for project abstract single-file attachments
#
# ============== Notes for reviewer ===============================================
# - This feature validates failure handling for single-file attachment uploads.
# - The scenarios cover two upload failure conditions:
#   - Upload request is aborted before completion.
#   - Upload request fails before completion.
# - In both failure conditions:
#   - The selected file should not be saved.
#   - The "Choose from folder" link should remain visible so the applicant can retry.
# ================================================================================

Feature: Single file upload interactions failure path
  As an applicant
  I want the attachment form to handle upload failures correctly
  So that I can retry uploading a file when an upload does not complete successfully

  @APPLY @APPLY_FORMS @CORE_REGRESSION
  Scenario: Aborted single-file upload keeps the choose from folder link visible
    Given I am authenticated as an applicant
    And I have opened the "Attachment Form"
    And the attachment upload request is aborted before completion

    When I upload a file to the single-file attachment field

    Then the uploaded file should not be saved
    And I should see 0 uploaded files
    And the "Choose from folder" link should remain visible

  @APPLY @APPLY_FORMS @CORE_REGRESSION
  Scenario: Failed single-file upload keeps the choose from folder link visible
    Given I am authenticated as an applicant
    And I have opened the "Attachment Form"
    And the attachment upload request is forced to fail

    When I upload a file to the single-file attachment field

    Then the uploaded file should not be saved
    And I should see 0 uploaded files
    And the "Choose from folder" link should remain visible