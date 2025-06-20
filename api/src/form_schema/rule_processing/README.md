# Overview
This folder contains files for processing a JSON rule schema.

These rule schemas are run in addition to our JSON Schema for a user's
JSON response to a form. We put logic here that either cannot go into
JSON Schema or would be more confusing to

This schema can handle:
* Pre-populating and post-populating fields in a users response
* Running validation rules that couldn't be done in JSON Schema

Schemas are defined as JSON in the same shape as the JSON response,
with rules defined at the value level.

For example, let us assume we have the following JSON response.
```json
{
  "info": {
    "opportunity_number": "ABC-123"
  }
}
```
If we wanted to define a rule for this, we would do:
```json
{
  "info": {
    "opportunity_number": {
      "<rule group>": {
        "rule": "<rule name>"
      }
    }
  }
}
```
There are two parts to the rule, first which group the rule belongs to
(eg. pre-population, post-population, or validation). Then inside of that
we define a rule, which will map to some bit of logic for how to handle it.
If a rule specifically needs additional configuration, we can put that alongside
the rule.

# Pre/post Population
Pre and post-population both are used for fields that we want our
system to populate automatically for a user. Pre-population fields
are those that get populated when a user first creates the application form
(as well as re-populated whenever modified to avoid a user changing the values).
Post-population occurs when a user submits their application.

For pre-population, this rule group is `gg_pre_population` with the following
rules currently implemented:
* `opportunity_number` - from the opportunity
* `opportunity_title` - from the opportunity
* `agency_name` - from the agency connected to the opportunity

For post-population, this rule group is `gg_post_population` with the following
rules currently implemented:
* `current_date` - The current date in the US EST timezone
* `signature` - The name of the creator of the application - NOTE - currently defaults to a random application user's email due to not having names in our system yet.

# Validation
Validation is used for validating things about the data that are too complex
or impractical to put in our JSON Schema. If at all possible, we should try
and put all validation rules into our JSON Schema for clarity. We should only
create a rule validation if that rule requires referencing data outside of the
JSON schema or is beyond the capabilities of JSON Schema.

Similar to JSON Schema validation, if any issues are found in the validation,
we'll add it to a list of validation issues.

For validation, this rule group is `gg_validation` with the following
rules currently implemented:
* `attachment` - verifies that the field representing an attachment ID corresponds to an attachment ID on the application itself.

# Future Work

## List Fields
Right now the schemas assume that all fields in the path to an object
are dictionaries, and the value itself is a non-list value. We don't
currently support lists, for example, the following JSON data would not
be something we could pre/post-populate OR validate at this time.

```json
{
  "my_list": [
    {
      "my_field": "abc"
    }
  ]
}
```

## More Fields
A few additional fields we'll want to pre-populate (based on grants.gov)
* UEI
* Opportunity Assistance Listing Number
* Opportunity Assistance Listing Title
* Closing Date
* Competition Title
* Competition ID

## Cross-field Validation
We likely want some form of cross-field validation. I don't think
JSON Schema supports a way to validate dates are in order for something
like start/end dates.
