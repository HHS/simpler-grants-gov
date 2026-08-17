# Feature: File upload interactions - Attachment Form streamed upload endpoint
# Related spec: e2e/apply/upload-interaction/happy-path/specs/happy-path-streamed-upload-endpoint.spec.ts
# Scenario: File upload behavior for Attachment Form using the streamed upload endpoint
#
# ============== Notes for reviewer ===============================================
# - This feature validates happy-path single-file upload behavior for the Attachment Form.
# - The streamed upload endpoint is stubbed so upload progress and completion behavior can be validated consistently.
# - The scenarios cover:
#   - Upload progress and successful attachment save.
#   - Uploaded file visibility after completion.
#   - Delete behavior and restoration of the file input.
#   - Single-file input behavior when multiple files are selected.
# ================================================================================

Feature: Attachment Form streamed upload endpoint happy path
  As an applicant
  I want to upload attachments using the streamed upload endpoint
  So that I can successfully add, review, and manage files on the Attachment Form

  @APPLY @APPLY_FORMS @CORE_REGRESSION
  Scenario: Streamed single upload shows progress and completes successfully
    Given I am authenticated as an applicant
    And I have opened the "Attachment Form"
    And the streamed upload endpoint is stubbed for the selected file

    When I upload a file to the single-file attachment field

    Then I should see an upload progress status
    And the attachment save request should complete successfully
    And the "Save and Refresh" button should be enabled
    And the upload "Cancel" button should no longer be visible

  @APPLY @APPLY_FORMS @CORE_REGRESSION
  Scenario: Uploaded file is visible after streamed upload completes
    Given I am authenticated as an applicant
    And I have opened the "Attachment Form"
    And the streamed upload endpoint is stubbed for the selected file

    When I upload a file to the single-file attachment field

    Then the uploaded file should be visible
    And the "Delete" button should be visible

  @APPLY @APPLY_FORMS @CORE_REGRESSION
  Scenario: Deleting a streamed upload restores the file input
    Given I am authenticated as an applicant
    And I have opened the "Attachment Form"
    And the streamed upload endpoint is stubbed for the selected file
    And I have successfully uploaded a file

    When I delete the uploaded file

    Then the file input should be visible again

  @APPLY @APPLY_FORMS @CORE_REGRESSION
  Scenario: Single-file upload accepts only one file
    Given I am authenticated as an applicant
    And I have opened the "Attachment Form"
    And the streamed upload endpoint is stubbed for the selected file
    And the attachment field does not allow multiple files

    When I attempt to upload multiple files to the single-file attachment field

    Then only one uploaded file should be accepted
    And the file input should remain hidden during the upload