
await page.goto('https://staging.simpler.grants.gov/opportunity/39cf0a5c-5fed-40b4-8f46-5374101ae419');


//Form name: Grants.gov Lobbying Form
await page3.getByRole('link', { name: 'Grants.gov Lobbying Form' }).click();

await page3.getByTestId('organization_name').fill('Applicant\'s Organization test');
await page3.getByTestId('authorized_representative_name--prefix').fill('Pre-test');
await page3.getByTestId('authorized_representative_name--first_name').fill('First Name test');
await page3.getByTestId('authorized_representative_name--middle_name').fill('Middle Name test');
await page3.getByTestId('authorized_representative_name--last_name').fill('Last Name test');
await page3.getByTestId('authorized_representative_name--suffix').fill('Suffix test');
await page4.getByTestId('authorized_representative_title').fill('Title test');
