// import { test, expect } from '@playwright/test';

// test('test', async ({ page }) => {
//   await page.goto('https://staging.simpler.grants.gov/opportunity/39cf0a5c-5fed-40b4-8f46-5374101ae419');
//   await page.getByRole('link', { name: 'Sign in' }).click();
//   await page.getByRole('textbox', { name: 'Email address' }).click();
//   await page.getByRole('textbox', { name: 'Email address' }).fill('aoy.simmons@reisystems.com');
//   await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
//   await page.getByRole('textbox', { name: 'Password' }).fill('Myw0rk*1985');
//   await page.getByRole('button', { name: 'Submit' }).click();
//   await page.getByRole('textbox', { name: 'Password' }).click();
//   await page.getByRole('textbox', { name: 'Password' }).fill('My');
//   await page.getByRole('textbox', { name: 'Password' }).press('NumLock');
//   await page.getByRole('textbox', { name: 'Password' }).press('Shift+F15');
//   await page.getByRole('textbox', { name: 'Password' }).fill('Myw0rk*1985_');
//   await page.getByRole('button', { name: 'Submit' }).click();
//   await page1.getByRole('link', { name: 'Choose another authentication' }).click();
//   await page1.getByRole('button', { name: 'Continue' }).click();
//   await page1.getByRole('textbox', { name: 'One-time code' }).click();
//   await page1.getByRole('textbox', { name: 'One-time code' }).fill('751320');
//   await page1.getByRole('button', { name: 'Submit' }).click();
//   await page1.goto('https://staging.simpler.grants.gov/opportunity/39cf0a5c-5fed-40b4-8f46-5374101ae419');
//   await page1.getByTestId('open-start-application-modal-button').click();
//   await page1.getByTestId('Select').selectOption('eab4a790-05f7-4866-9da5-abaeb992a566');
//   await page1.getByTestId('textInput').click();
//   await page1.getByTestId('textInput').fill('Test');
//   await page1.getByText('Name this application *Create').click();
//   await page1.getByTestId('application-start-save').click();
//   await page1.getByTestId('application-start-save').click();
//   await page1.getByRole('link', { name: 'Application for Federal' }).click();
//   await page1.getByTestId('apply-form-save').click();
//   await page.locator('#main-content').click();
//   await page.getByRole('textbox', { name: 'Password' }).press('NumLock');
//   await page.getByRole('textbox', { name: 'Password' }).press('Shift+F15');

//   await page.locator('#main-content').getByTestId('gridContainer').click();
//   await page.getByRole('button', { name: 'Account' }).click();
//   await page.getByRole('button', { name: 'Account' }).press('NumLock');
//   await page.getByRole('button', { name: 'Account' }).press('Shift+F15');
//   await page.getByTestId('applicant--street1').click();
//   await page.getByTestId('applicant--street1').click();
//   await page.getByTestId('applicant--street1').click();
//   await page.getByTestId('applicant--street1').click();
//   await page.getByTestId('applicant--street1').click();
//   await page.getByTestId('applicant--street1').press('Escape');
//   await page.getByTestId('applicant--street1').click();
//   await expect(page.getByTestId('applicant--street1')).toBeVisible();
//   await page.getByTestId('applicant--street1').click();
//   await page.getByTestId('applicant--street1').dblclick();
//   await page.getByTestId('applicant--street1').fill('123 Main St');

//   await page.getByTestId('applicant--city').click();
//   await page.getByTestId('applicant--city').dblclick();
//   await page.getByTestId('applicant--city').fill('Boise');
//   await page.getByTestId('applicant--state').click();


//   await page.getByTestId('combo-box-toggle').click();
//   await page.getByTestId('combo-box-option-A: State Government').click();
// });