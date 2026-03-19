
await page.goto('https://staging.simpler.grants.gov/opportunity/39cf0a5c-5fed-40b4-8f46-5374101ae419');

//form name:Project Abstract Summary
await page2.getByRole('link', { name: 'Project Abstract Summary' }).click();

await page2.getByTestId('applicant_name').fill('Applicant Name test');
await page2.getByTestId('project_title').fill('Project Title test');
await page2.getByTestId('textarea').fill('This form fill by automation test');
