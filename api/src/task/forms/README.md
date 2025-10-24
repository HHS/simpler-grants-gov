# Overview
The `list_forms_task.py` script in this folder can be used
to check all forms in a specified environment and output
whether they're up-to-date.

The `update_form_task.py` script in this folder can be used
to update a form in any environment copying the form from your
local database to the specified environment.

__IMPORTANT__ - These scripts work with forms as defined in
the src.form_schemas.forms.__init__.get_active_forms function.

# List Form Task
## Running
The script takes in the following parameters:
* `--environment` - The environment you want to run in
* `--verbose` - Whether to output how every field will change, can be very noisy if large fields like the JSON schema will change
* (Environment Variable) `NON_LOCAL_API_AUTH_TOKEN` - the auth token for calling the environment - at the moment MUST be the same auth token the frontend uses (the first one configured in our API_AUTH_TOKEN env var).

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
* (Environment Variable) `NON_LOCAL_API_AUTH_TOKEN` - the auth token for calling the environment - at the moment MUST be the same auth token the frontend uses (the first one configured in our API_AUTH_TOKEN env var).

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
