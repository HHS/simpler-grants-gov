import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://staging.simpler.grants.gov/grantor/opportunities/create?agency=832df791-e397-4aab-8889-9b981b23db86');
  await page.getByRole('link', { name: 'Sign in' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('aoy.simmons@reisystems.com');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('Myw0rk*1985_');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('link', { name: 'Choose another authentication' }).click();
  await page.getByText('Text message Get one-time').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('textbox', { name: 'One-time code' }).click();
  await page.getByRole('textbox', { name: 'One-time code' }).fill('37');
  await page.getByRole('textbox', { name: 'One-time code' }).press('NumLock');
  await page.getByRole('textbox', { name: 'One-time code' }).press('Shift+F15');
  await page.getByRole('textbox', { name: 'One-time code' }).fill('379044');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page1.goto('https://staging.simpler.grants.gov/grantor/opportunities/create?agency=832df791-e397-4aab-8889-9b981b23db86');


  //https://staging.simpler.grants.gov/grantor/opportunities?agency=832df791-e397-4aab-8889-9b981b23db86
  //Opportunities List page
  await page1.getByRole('link', { name: 'Create' }).click();
  await page1.getByRole('link', { name: 'Opportunities' }).click();

  //https://staging.simpler.grants.gov/grantor/opportunities/create?agency=832df791-e397-4aab-8889-9b981b23db86
  //Create Opportunity page

  await page1.getByRole('link', { name: 'Create Opportunity' }).click();
  await expect(page1.locator('h1')).toContainText('Create Opportunity');
  await page1.getByRole('textbox', { name: 'Opportunity number*' }).fill('Test-001-opportunity-number');
  await page1.getByTestId('textarea').fill('Test opportunity title');
  await page1.getByLabel('Grant selection method*').selectOption('discretionary');
  await page1.getByRole('textbox', { name: 'Assistance listing number*' }).fill('00.000');
  await page1.getByRole('button', { name: 'Save and continue' }).click();
  await expect(page1.locator('h1')).toContainText('Opportunity #');

  //https://staging.simpler.grants.gov/grantor/opportunity/e7a81eea-309f-4c34-ac94-2996ae34b1a4/edit?fromCreate=true
  //Opportunity #Edit page

  await page1.getByLabel('Funding type*').selectOption('grant');
  await page1.getByLabel('Category*').selectOption('recovery_act');
  await page1.getByRole('textbox', { name: 'Expected number of awards' }).fill('10');
  await page1.getByRole('textbox', { name: 'Estimated total program' }).fill('1000000');
  await page1.getByRole('textbox', { name: 'Award minimum' }).fill('50000');
  await page1.getByRole('textbox', { name: 'Award maximum' }).fill('100000');
  await page1.getByRole('textbox', { name: 'Publish date*' }).fill('<today>');
  await page1.getByRole('textbox', { name: 'Close date*' }).fill('<today>+30');
  await page1.getByRole('textbox', { name: 'Close date explanation' }).fill('Test close date explanation');
  await page1.getByText('Small businesses', { exact: true }).click();
  await page1.getByText('Other Native American tribal').click();
  await page1.getByText('Independent school districts').click();
  await page1.getByText('Individuals', { exact: true }).click();
  await page1.getByText('State governments').click();
  await page1.getByRole('textbox', { name: 'Description' }).fill('Additional - Test opportunity description');
  await page1.getByRole('textbox', { name: 'Link to additional information' }).fill('https://www.example.com/additional-info');
  await page1.getByRole('textbox', { name: 'Link display text' }).fill('Additional Info');
  await page1.getByRole('textbox', { name: 'Grantor contact details' }).fill('Test grantor contact details');
  await page1.getByRole('textbox', { name: 'Contact email' }).fill('test@example.com');
  await page1.getByRole('textbox', { name: 'Email display text' }).fill('Contact Email');
  await page1.getByTestId('file-input-input').setInputFiles('c:/SGM-Main/simpler-grants-gov/frontend/tests/e2e/test-file.txt');
  await page1.getByRole('button', { name: 'Save' }).click();
  expect(page1.locator('h2')).toContainText('Saved successfully');
  expect(page1.locator('p')).toContainText('Your changes have been saved.')
  await page1.getByRole('button', { name: 'Publish' }).click();
  await expect(page1.getByRole('heading', { name: 'Opportunities List' })).toBeVisible();
  await expect(page1.getByTestId('responsive-data-0-2')).toContainText('posted');

});