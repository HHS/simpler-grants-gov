import type { Page, TestInfo } from "@playwright/test";
import { buildFlexibleFormNameRegex, openForm } from "./form-navigation-utils";
import { clickSaveButton } from "./save-form-utils";
import { fieldHandlerDispatcher } from "@e2e-utils/index";
import { FillFieldDefinition, FormFillFieldDefinitions } from "../../utils/types";
import { fieldDependsOn } from "../../utils/types";

export async function fillField(
	testInfo: TestInfo,
	page: Page,
	field: FillFieldDefinition,
	data: string | boolean | undefined,
): Promise<void> {
	const fieldIdentifier = field.section
		? `${field.section}-${field.field}`
		: field.field;
	try {
		if (data === undefined) {
			await testInfo.attach(`fillField-${fieldIdentifier}-skipped`, {
				body: `Skipped ${fieldIdentifier}: no data provided`,
				contentType: "text/plain",
			});
			return;
		}
		const handler = fieldHandlerDispatcher[field.type];
		if (!handler) {
			throw new Error(`No handler found for field type: ${field.type}`);
		}
		await handler(testInfo, page, field, data);
		await testInfo.attach(`fillField-${fieldIdentifier}-success`, {
			body: `Successfully filled ${fieldIdentifier}: "${data}"`,
			contentType: "text/plain",
		});
	} catch (error) {
		await testInfo.attach(`fillField-${fieldIdentifier}-error`, {
			body: `Failed to fill ${fieldIdentifier}: ${
				error instanceof Error ? error.message : String(error)
			}`,
			contentType: "text/plain",
		});
		throw new Error(
			`Failed to fill ${field.field}: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}
}


export async function fillFormPartial(
  testInfo: TestInfo,
  page: Page,
  fieldDefinitions: FormFillFieldDefinitions,
  data: Record<string, string | boolean>
): Promise<void> {
  for (const key of Object.keys(data)) {
    const fieldDef = fieldDefinitions[key as keyof FormFillFieldDefinitions];
    if (fieldDef) {
      await fillField(testInfo, page, fieldDef, data[key]);
    }
  }
}

export async function fillForm(
	testInfo: TestInfo,
	page: Page,
	config: {
		formName: string | RegExp;
		fields: FormFillFieldDefinitions;
		saveButtonTestId: string;
		noErrorsText?: string;
		beforeSave?: (page: Page) => Promise<void>;
	},
	data: Record<string, string | boolean>,
	returnToApplication = true,
): Promise<void> {
	const { formName, fields, saveButtonTestId } = config;
	const applicationURL = page.url();
	await testInfo.attach("fillForm-applicationURL", {
		body: `Application URL: ${applicationURL}`,
		contentType: "text/plain",
	});
	const formMatcher =
		formName instanceof RegExp
			? formName
			: buildFlexibleFormNameRegex(formName);
	try {
		const opened = await openForm(page, formMatcher);
		if (!opened) {
			throw new Error(`Could not find or open form: ${formMatcher}`);
		}
		const formReadyMatcher =
			formName instanceof RegExp
				? formName
				: buildFlexibleFormNameRegex(formName);
		await page
			.getByText(formReadyMatcher)
			.first()
			.waitFor({ state: "visible", timeout: 35000 });
		for (const [fieldIdentifier, fieldConfig] of Object.entries(fields)) {
			const dataForField = data[fieldIdentifier];
			if (dataForField === undefined) {
				continue;
			}
			if (!fieldDependsOn(fieldConfig, data)) {
				await testInfo.attach(`fillField-${fieldIdentifier}-skipped`, {
					body: `Skipped ${fieldIdentifier}: dependency ${fieldConfig.dependsOn?.field} did not match ${fieldConfig.dependsOn?.value}`,
					contentType: "text/plain",
				});
				continue;
			}
			await fillField(testInfo, page, fieldConfig, dataForField);
		}
		if (config.beforeSave) {
			await config.beforeSave(page);
		}
		await clickSaveButton(page, saveButtonTestId);
		if (returnToApplication) {
			await page.goto(applicationURL);
		}
	} catch (error) {
		await testInfo.attach("fillForm-error", {
			body: error instanceof Error ? error.message : String(error),
			contentType: "text/plain",
		});
		throw error;
	}
}
export interface FillFormConfig {
  formName: string | RegExp;
  fields: FormFillFieldDefinitions;
  saveButtonTestId: string;
  noErrorsText?: string;
  /**
   * Optional form-specific hook called before the save button is clicked.
   * Use for pre-save interactions that cannot be expressed as a field definition.
   * e.g. SF-424A confirmation checkbox that only appears in this form.
   */
  beforeSave?: (page: Page) => Promise<void>;
}
