# Feature: File upload interactions - Attachment Form streamed upload endpoint
# Related spec: e2e/apply/upload-interaction/happy-path/specs/happy-path-streamed-single-upload-endpoint.spec.ts
# Scenario: File upload behavior for Attachment Form using the streamed upload endpoint
#
# ============== Notes for reviewer ===============================================
# - This feature validates happy-path single-file upload behavior for the Attachment Form.
# - The scenarios cover:
#   - Upload progress and successful attachment save.
#   - Delete behavior and restoration of the file input.
#   - Single-file input behavior when multiple files are selected.
# ================================================================================

Feature: Attachment Form streamed upload endpoint happy path
  As an applicant
  I want to upload attachments using the streamed upload endpoint
  So that I can successfully add, review, and manage files on the Attachment Form

  Scenario: Streamed single upload shows progress and allows deletion after completion
    Given I am authenticated as an applicant
    And I have opened the "Attachment Form"

    When I upload a file to the single-file attachment field

    Then I should see an upload progress status
    And the attachment save request should complete successfully
    And the upload "Cancel" button should no longer be visible
    And the uploaded file should be visible
    And the "Delete" button should be visible

  Scenario: Streamed single upload deletion restores the file input
    Given I am authenticated as an applicant
    And I have opened the "Attachment Form"
    And I have successfully uploaded a file

    When I delete the uploaded file

    Then the file input should be visible again

  Scenario: Single-file streamed upload accepts only one file
    Given I am authenticated as an applicant
    And I have opened the "Attachment Form"
    And the attachment field does not allow multiple files

    When I attempt to upload multiple files to the single-file attachment field

    Then only one uploaded file should be accepted
    And the file input should remain hidden during the upload
