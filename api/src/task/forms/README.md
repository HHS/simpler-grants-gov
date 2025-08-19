# Overview
The `update_form_task.py` script in this folder can be used
to update a form in any environment copying the form from your
local database to the specified environment.

__IMPORTANT__ - Because this script pulls data from your local database,
it is recommended that you completely remake and reload forms into your database
locally before running it.

# Running
__IMPORTANT__ - As currently written, this script has a few caveats:
* If you want to test against your local database, you must be running outside of Docker due to Docker/network weirdness that I didn't try to solve.
* The form instruction record must be manually uploaded to s3 and inserted into the database - see the below section for details.

The script takes in the following parameters:
* `--environment` - The environment you want to run in
* `--form-id` - The ID of the form you want to update - Grab the ID from our static definition of a form in our code, do not create a new ID
* `--form-instruction-id` - The ID of the form instruction of a form, if not included will be set as null, see section below for details
* `--dry-run/--no-dry-run` - Whether to actually make the call to the API endpoint
* (Environment Variable) `NON_LOCAL_API_AUTH_TOKEN` - the auth token for calling the environment - at the moment MUST be the same auth token the frontend uses (the first one configured in our API_AUTH_TOKEN env var).

```sh
make cmd args="task update-form --environment=local --form-id=c3c5c7e9-0b24-41f8-8da3-98241fb341fe --dry-run"
```

## Setting up a form instruction record
For now, we have to manually setup the form instruction record. This requires the following steps:
1. Copy the file to the s3 public s3 bucket: `aws s3 cp EXAMPLE-V1.0-Instructions.pdf s3://api-dev-public-files-20241217184925208000000003/forms/c3c5c7e9-0b24-41f8-8da3-98241fb341fe/instructions/EXAMPLE-V1.0-Instructions.pdf`
2. Login to the DB and insert the record, generate a new UUID for this. The file_location should match the same s3 path, and the file_name should be just the name of the file:
```postgresql
INSERT INTO api.form_instruction(
	form_instruction_id, file_location, file_name)
	VALUES ('f4f3d4d5-6619-44f8-90f3-97449d0137ff', 's3://api-dev-public-files-20241217184925208000000003/forms/c3c5c7e9-0b24-41f8-8da3-98241fb341fe/instructions/EXAMPLE-V1.0-Instructions.pdf', 'EXAMPLE-V1.0-Instructions.pdf');
```
3. When calling the script, add the form instruction ID: `--form-instruction-id=f4f3d4d5-6619-44f8-90f3-97449d0137ff`

If you want to update a file, if the name of it isn't changing, you only need to re-upload it to s3.
If you want to change the file, you'll need to delete the file from s3 and the DB.
