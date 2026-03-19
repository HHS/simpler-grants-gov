
await page.goto('https://staging.simpler.grants.gov/opportunity/39cf0a5c-5fed-40b4-8f46-5374101ae419');

//form name:CD511
await page4.getByRole('link', { name: 'CD511' }).click();

await page4.getByTestId('applicant_name').fill('Application Name test');
await page4.getByTestId('award_number').fill('AWARD-NUMBER');
await page4.getByTestId('project_name').fill('Project Name test');
await page4.getByTestId('contact_person--prefix').fill('Prefix tes');
await page4.getByTestId('contact_person--first_name').fill('First Name test');
await page4.getByTestId('contact_person--middle_name').fill('Middle Name test');
await page4.getByTestId('contact_person--last_name').fill('Last Name test');
await page4.getByTestId('contact_person--suffix').fill('Suffix tes');
await page4.getByTestId('contact_person_title').fill('Title test');

