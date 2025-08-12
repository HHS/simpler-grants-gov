# Overview
This document details how to setup data for various scenarios.


# Local
In almost all cases, if you want to setup data locally, you almost
always want to use our DB factories as they're far more convenient
than interacting with the database directly.

The easiest way to interact with the database is using our `make console`
command which will open a REPL that lets you run our python code directly

Our factories will handle setting up dependent data (ie. foreign keys)
and populating all the various fields in the table.

For example, if you wanted to create an opportunity with a particular
opportunity title, you could do this in the python console:

```py
f.OpportunityFactory.create()
# will echo out
Opportunity(
│   opportunity_id=116,
│   opportunity_number='BBQ8530910',
│   opportunity_title='my fun title',
│   agency_code='DOD-COE-FW',
│   category=<OpportunityCategory.CONTINUATION: 'continuation'>,
│   category_explanation=None,
│   is_draft=False,
│   revision_number=0,
│   modified_comments=None,
│   publisher_user_id=None,
│   publisher_profile_id=None,
│   created_at=datetime.datetime(2025, 6, 26, 16, 10, 25, 420030, tzinfo=datetime.timezone.utc),
│   updated_at=datetime.datetime(2025, 6, 26, 16, 10, 25, 420030, tzinfo=datetime.timezone.utc)
)
```

If you want the factories to be able to create a lot of data
in a common pattern, we have a seed script that we can put
common data scenarios into. This script just uses the factories
the same as above.

# Non-local
Our factories only work locally, setting up data elsewhere likely
requires writing SQL directly or taking advantage of one of our backend
processes.

## Setting up a fake Organization
An organization is created in our system when our sam.gov extract process runs.
If we want to setup a fake organization, we just need to create a record
in the `sam_gov_entity` table. If the EBIZ POC email matches an actual users
email (like your own), it'll be made into an organization automatically.

You can insert a record into the sam.gov entity table by doing a query like:
```sql
INSERT INTO api.sam_gov_entity (sam_gov_entity_id, uei, legal_business_name, expiration_date, initial_registration_date, last_update_date, ebiz_poc_email, ebiz_poc_first_name, ebiz_poc_last_name, has_debt_subject_to_offset, has_exclusion_status)
		VALUES(gen_random_uuid (), 'FAKEUEI00001', 'Bobs Test Org', '2060-01-01', '2025-06-26', '2025-06-26', 'fake_mail@example.com', 'Bob', 'Smith', FALSE, FALSE)
```
A few notes about this query:
* The UEI needs to be unique, and ideally something that is clearly not going to overlap with any real UEI that'll get processed.
* The expiration date is set very far in the future so we don't need to worry about these dummy orgs expiring
* I'd recommend adjusting the first/last and legal business name to something relevant to the user

After you've loaded that, you can setup the rest of the organization data by either
waiting for the daily sam.gov extract task to run, OR running it yourself (requires prior AWS CLI configuration).

**Note**: The SAM.gov extract task is automatically scheduled to run daily at 8:00am ET (9:00am during non-DST) in all environments to fetch the latest extracts from SAM.gov and keep organization data up to date.

```shell
bin/run-command  api dev '["poetry", "run", "flask", "task", "sam-extracts", "--no-fetch-extracts", "--no-process-extracts", "--create-orgs"]'
```
