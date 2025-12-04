# Overview
The `list_forms_task.py` script in this folder can be used
to check all forms in a specified environment and output
whether they're up-to-date.

The `update_form_task.py` script in this folder can be used
to update a form in any environment copying the form from your
local database to the specified environment.

__IMPORTANT__ - These scripts work with forms as defined in
the src.form_schemas.forms.__init__.get_active_forms function.

# Auth
Both of these scripts talk with our API endpoints in the specified environment
and need an auth token to work. There are currently two different auth token approaches
you can use:

* `FORM_X_API_KEY_ID` - An API key attached to your user in the specified environment. The update-form task requires this user have the `update_form` privilege.
* `NON_LOCAL_API_AUTH_TOKEN` (deprecated - will be removed soon) - the auth token for calling the environment - at the moment MUST be the same auth token the frontend uses (the first one configured in our API_AUTH_TOKEN env var)

To setup your `FORM_X_API_KEY_ID`, do the following:
* Go to the specified environment and generate an API key after logging in (eg. in staging, go to the [API Dashboard](https://staging.simpler.grants.gov/api-dashboard))
* To gain the `update_form` privilege for your user, you can add the internal Nava role to your user by connecting to the database and running:

```sql
-- First Find your user ID using your login email
SELECT user_id from api.link_external_user WHERE email = 'example@example.com';

-- Give your user that role
INSERT INTO api.internal_user_role(user_id, role_id) VALUES ('YOUR USER ID', '57e8875f-c154-41be-a5f6-602f4c92d6e6');
```

# List Form Task
## Running
The script takes in the following parameters:
* `--environment` - The environment you want to run in
* `--verbose` - Whether to output how every field will change, can be very noisy if large fields like the JSON schema will change
* Auth is managed via an environment variable, see above.

```sh
make cmd args="task list-forms --environment=dev --verbose"
```

This will produce a table view of all the forms in your local database
and whether they are different than the form in a given environment.

It will also produce the commands for the update-form script for any forms
that require updates, or isn't yet in that environment.

### Form Instructions
This logic does not diff the form instruction record in any way. It will
always match as we don't have form instructions setup locally at this time.

The command it outputs for using the update-form script will always have the
form instructions ID of the form we fetched from the given environment.

# Update Form Task
## Running
__IMPORTANT__ - As currently written, this script has a few caveats:
* If you want to test against your local database, you must be running outside of Docker due to Docker/network weirdness that I didn't try to solve.
* The form instruction record must be manually uploaded to s3 and inserted into the database - see the below section for details.

The script takes in the following parameters:
* `--environment` - The environment you want to run in
* `--form-id` - The ID of the form you want to update - Grab the ID from our static definition of a form in our code, do not create a new ID
* Auth is managed via an environment variable, see above.

```sh
make cmd args="task update-form --environment=local --form-id=c3c5c7e9-0b24-41f8-8da3-98241fb341fe"
```

### Setting up a form instruction record
For now, we have to manually setup the form instruction record. This requires the following steps:
1. Generate a new UUID for the `form_instruction_id`, set this on the statically defined form
2. Copy the file to the s3 public s3 bucket: `aws s3 cp EXAMPLE-V1.0-Instructions.pdf s3://api-dev-public-files-20241217184925208000000003/forms/c3c5c7e9-0b24-41f8-8da3-98241fb341fe/instructions/EXAMPLE-V1.0-Instructions.pdf`
3. Login to the DB and insert the record, generate a new UUID for this. The file_location should match the same s3 path, and the file_name should be just the name of the file:
```postgresql
INSERT INTO api.form_instruction(
	form_instruction_id, file_location, file_name)
	VALUES ('The ID you generated in step 1', 'The same s3 path as above', 'EXAMPLE-V1.0-Instructions.pdf');
```

If you want to update a file, if the name of it isn't changing, you only need to re-upload it to s3.
If you want to change the file, you'll need to delete the file from s3 and the DB, and change the information accordingly.

# Creating opportunities for a form in an environment (non-prod)
If you have created a brand new form in an environment and want it easily
attached to an opportunity, we have an ECS task that can be run (requires AWS access)
by running this with the appropriate environment:
```shell
bin/run-command api staging '["poetry", "run", "flask", "task", "build-automatic-opportunities"]'
```

What it will do is for each form will see if an opportunity already exists and if not
create a new opportunity+competition with just that form on it.

It will also always make a new opportunity with every form on its competition.

These won't immediately be viewable in search, but can be found after the search data
gets loaded by searching `SGG`. For example in our staging environment, you
can see forms this script previously created at https://staging.simpler.grants.gov/search?query=SGG
