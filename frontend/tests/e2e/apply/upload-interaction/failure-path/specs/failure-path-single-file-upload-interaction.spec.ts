/**
 * @feature File upload interactions - Failure Path
 * @featureFile e2e/apply/upload-interaction/failure-path/features/failure-path-single-file-upload-interaction.feature
 * @scenario Upload error handling for project abstract single-file attachments
 */

import { expect, test, type Page } from "@playwright/test";
import {
  fieldDefinitionsProjectAbstract,
  PROJECT_ABSTRACT_FORM_MATCHER,
} from "tests/e2e/apply/fixtures/project-abstract-field-definitions";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { createAuthenticatedApplicationLifecycle } from "tests/e2e/utils/common/auth-storage-state-utils";
import {
  abortAttachmentUploadRequest,
  assertFileInputVisible,
  assertUploadDidNotSave,
  failAttachmentUploadRequest,
  TEST_UPLOAD_DIR,
  uploadFile,
} from "tests/e2e/utils/common/file-upload-utils";
import { openApplicationForm } from "tests/e2e/utils/forms/form-navigation-utils";

const { APPLY, APPLY_FORMS, CORE_REGRESSION } = VALID_TAGS;
const { testOrgLabel, targetEnv } = playwrightEnv;

const OPPORTUNITY_ID =
  targetEnv === "staging"
    ? "39df8091-6e99-4b0f-9db7-1f3aca9cb6e5"
    : "c3c59562-a54f-4203-b0f6-98f2f0383481";
const OPPORTUNITY_URL = `/opportunity/${OPPORTUNITY_ID}`;
const SAMPLE_FILE_NAME = "sample-upload-kb.pdf";
const SAMPLE_UPLOAD_FILE = `${TEST_UPLOAD_DIR}/${SAMPLE_FILE_NAME}`;

const authenticatedLifecycle = createAuthenticatedApplicationLifecycle({
  targetEnv,
  opportunityUrl: OPPORTUNITY_URL,
  organizationLabel: testOrgLabel,
  timeoutMs: 300_000,
  skipTest: (condition, description) => test.skip(condition, description),
});

test.beforeAll(authenticatedLifecycle.beforeAll);
test.beforeEach(authenticatedLifecycle.beforeEach);
test.afterEach(authenticatedLifecycle.afterEach);

test.describe("Single file upload interactions - Failure Path", () => {
  test(
    "aborted upload keeps the choose from folder link visible",
    { tag: [APPLY, APPLY_FORMS, CORE_REGRESSION] },
    async () => {
      const page = authenticatedLifecycle.getPage();

      // Given the applicant has opened the Project Abstract attachment form
      await openApplicationForm(
        page,
        authenticatedLifecycle.getApplicationUrl(),
        PROJECT_ABSTRACT_FORM_MATCHER,
      );

      // And the upload request is aborted before completion
      await abortAttachmentUploadRequest(page);

      // When the applicant uploads a file
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE,
        fieldDefinitionsProjectAbstract.attachment,
      );

      // Then I should not see the file saved and the "choose from folder" link should remain visible
      await assertUploadDidNotSave(
        page,
        SAMPLE_FILE_NAME,
        0,
        fieldDefinitionsProjectAbstract.attachment,
      );
    },
  );

  test(
    "failed single-file upload keeps the choose from folder link visible",
    { tag: [APPLY, APPLY_FORMS, CORE_REGRESSION] },
    async () => {
      const page = authenticatedLifecycle.getPage();

      // Given the applicant has opened the Project Abstract attachment form
      await openApplicationForm(
        page,
        authenticatedLifecycle.getApplicationUrl(),
        PROJECT_ABSTRACT_FORM_MATCHER,
      );

      // And the upload request is forced to fail
      await failAttachmentUploadRequest(page);

      // When the applicant uploads a file
      await uploadFile(
        page,
        SAMPLE_UPLOAD_FILE,
        fieldDefinitionsProjectAbstract.attachment,
      );

      // Then I should not see the file saved and the "choose from folder" link should remain visible
      await assertUploadDidNotSave(
        page,
        SAMPLE_FILE_NAME,
        0,
        fieldDefinitionsProjectAbstract.attachment,
      );
    },
  );
});
