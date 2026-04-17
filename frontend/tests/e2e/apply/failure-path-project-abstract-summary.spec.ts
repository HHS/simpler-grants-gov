import {
	test,
	type BrowserContext,
	type Page,
	type TestInfo,
} from "@playwright/test";
import { getOpportunityId } from "tests/e2e/get-opportunityId-utils";
import playwrightEnv from "tests/e2e/playwright-env";
import { VALID_TAGS } from "tests/e2e/tags";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { createApplication } from "tests/e2e/utils/create-application-utils";
import { openForm } from "tests/e2e/utils/forms/form-navigation-utils";
import { saveForm } from "tests/e2e/utils/forms/save-form-utils";
import {
	verifyFormStatusAfterSave,
	verifyFormStatusOnApplication,
} from "tests/e2e/utils/forms/verify-form-status-utils";

import {
	PROJECT_ABSTRACT_SUMMARY_FORM_MATCHER,
	PROJECT_ABSTRACT_SUMMARY_REQUIRED_FIELD_ERRORS,
} from "./fixtures/project-abstract-summary-field-definitions";

const { APPLY, CORE_REGRESSION } = VALID_TAGS;
const { testOrgLabel, targetEnv } = playwrightEnv;
const OPPORTUNITY_URL = `/opportunity/${getOpportunityId()}`;

// Skip non-Chrome browsers in staging
test.beforeEach(({ page: _ }, testInfo) => {
	if (targetEnv === "staging") {
		test.skip(
			testInfo.project.name !== "Chrome",
			"Staging MFA login is limited to Chrome to avoid OTP rate-limiting",
		);
	}
});

test(
	"Project Abstract Summary - error validation on empty save",
	{ tag: [APPLY, CORE_REGRESSION] },
	async (
		{ page, context }: { page: Page; context: BrowserContext },
		testInfo: TestInfo,
	) => {
		test.setTimeout(300_000); // 5 min timeout

		const isMobile = testInfo.project.name.match(/[Mm]obile/);

		await authenticateE2eUser(page, context, !!isMobile);

		await createApplication(page, OPPORTUNITY_URL, testOrgLabel);
		const applicationUrl = page.url();

		const opened = await openForm(page, PROJECT_ABSTRACT_SUMMARY_FORM_MATCHER);
		if (!opened) {
			throw new Error(
				"Could not find or open Project Abstract Summary form link on the application forms page",
			);
		}

		await saveForm(page, true);

		await verifyFormStatusAfterSave(
			page,
			"incomplete",
			PROJECT_ABSTRACT_SUMMARY_REQUIRED_FIELD_ERRORS,
		);

		await verifyFormStatusOnApplication(
			page,
			"incomplete",
			PROJECT_ABSTRACT_SUMMARY_FORM_MATCHER,
			applicationUrl,
		);
	},
);
