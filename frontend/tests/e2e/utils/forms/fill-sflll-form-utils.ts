import { Page } from "@playwright/test";

/**
 * Fill the Disclosure of Lobbying Activities (SF-LLL) form with test data.
 * @param page Playwright Page object
 * @param data Optional override for form fields
 */
export async function fillSflllForm(
  page: Page,
  data: Partial<{
    federalActionType: string;
    federalActionStatus: string;
    reportType: string;
    entityType: string;
    orgName: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    fedAgency: string;
    lrFirstName: string;
    lrLastName: string;
    lrStreet: string;
    lrCity: string;
    lrState: string;
    lrZip: string;
    indFirstName: string;
    indLastName: string;
    indStreet: string;
    indCity: string;
    indState: string;
    indZip: string;
    sigFirstName: string;
    sigLastName: string;
  }> = {}
) {
  await page.getByLabel("Type of Federal Action*").selectOption(data.federalActionType || "Grant");
  await page.getByLabel("Status of Federal Action*").selectOption(data.federalActionStatus || "InitialAward");
  await page.getByLabel("Report Type*").selectOption(data.reportType || "InitialFiling");
  await page.getByLabel("Entity Type*").selectOption(data.entityType || "Prime");
  await page.getByTestId("reporting_entity--applicant_reporting_entity--organization_name").fill(data.orgName || "ENTITY ORG NAME");
  await page.getByTestId("reporting_entity--applicant_reporting_entity--address--street1").fill(data.street || "ENTITY TEST STREET");
  await page.getByTestId("reporting_entity--applicant_reporting_entity--address--city").fill(data.city || "ENTITY TEST CITY");
  await page.locator('#reporting_entity--applicant_reporting_entity--address--state').selectOption(data.state || "AK: Alaska");
  await page.getByTestId("reporting_entity--applicant_reporting_entity--address--zip_code").fill(data.zip || "20744000");
  await page.getByTestId("federal_agency_department").fill(data.fedAgency || "TEST FED AGENCY");
  await page.getByTestId("lobbying_registrant--individual--first_name").fill(data.lrFirstName || "LR FIRST NAME");
  await page.getByTestId("lobbying_registrant--individual--last_name").fill(data.lrLastName || "LR LAST NAME");
  await page.getByTestId("lobbying_registrant--address--street1").fill(data.lrStreet || "LR TEST STREET");
  await page.getByTestId("lobbying_registrant--address--city").fill(data.lrCity || "LR TEST CITY");
  await page.locator('#lobbying_registrant--address--state').selectOption(data.lrState || "AK: Alaska");
  await page.getByTestId("lobbying_registrant--address--zip_code").fill(data.lrZip || "20744000");
  await page.getByTestId("individual_performing_service--individual--first_name").fill(data.indFirstName || "INDV TEST FIRST NAME");
  await page.getByTestId("individual_performing_service--individual--last_name").fill(data.indLastName || "INDV TEST LAST NAME");
  await page.getByTestId("individual_performing_service--address--street1").fill(data.indStreet || "INDV TEST STREET");
  await page.getByTestId("individual_performing_service--address--city").fill(data.indCity || "INDV TEST CITY");
  await page.locator('#individual_performing_service--address--state').selectOption(data.indState || "AK: Alaska");
  await page.getByTestId("individual_performing_service--address--zip_code").fill(data.indZip || "20744000");
  await page.getByTestId("signature_block--name--first_name").fill(data.sigFirstName || "TEST FIRST NAME");
  await page.getByTestId("signature_block--name--last_name").fill(data.sigLastName || "TEST LAST NAME");
}
