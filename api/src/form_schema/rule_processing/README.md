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

## Arrays
If a field in the JSON represents an array, we can add a type in path
to let the processing logic know it should apply the rule to all values in that array.
For example, with data that looks like:

```json
{
  "my_array_field": [
    {"x":  "ABC", "y": "XYZ"},
    {"x":  "abc", "y": "xyz"}
  ]
}
```
We could write a rule that applies to all elements of the `my_array_field` field like so:
```json
{
  "my_array_field": {
    "gg_type": "array",
    "z": {
      "gg_pre_population": {
        "rule": "opportunity_number"
      }
    }
  }
}
```
Which upon running would produce something like:
```json
{
  "my_array_field": [
    {"x":  "ABC", "y": "XYZ", "z": "my-opportunity-number"},
    {"x":  "abc", "y": "xyz", "z": "my-opportunity-number"}
  ]
}
```
Note that this array logic is setup in a way that does not ever
add or modify how many items are in an array, if the data were null
or an empty array, this sort of rule would do nothing (eg. `{"my_array_field": []}` would not be updated by this rule).

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
* `uei` - the UEI from the application's organization, `00000000INDV` if the application is from an individual
* `assistance_listing_number` - from the competition
* `assistance_listing_program_title` - from the competition
* `public_competition_id` - from the competition
* `competition_title` - from the competition
* `sum_monetary` - calculated based on other fields in the JSON, see Monetary Summation section below for further details

For post-population, this rule group is `gg_post_population` with the following
rules currently implemented:
* `current_date` - The current date in the US EST timezone
* `signature` - The name of the creator of the application - NOTE - currently defaults to a random application user's email due to not having names in our system yet.

## Null Population
Several of our rules like `public_competition_id` and `competition_title` can be
null due to them being nullable in their corresponding DB tables. We don't generally
configure our JSON schema to allow null values, instead preferring a value to be excluded
if there is no value (eg. We want `{}` over `{"my_field": null}`). However, if the rule
returns null, we have to do something. For that reason, all pre/post population rules
can take in an optional `null_population` rule with the following values:
* `exclude_value` (the default if no rule configured) - This will not add the value to the JSON schema AND remove any existing values.
* `set_as_null` - This will set the value as null, behaving the same as any other population

The default assumes we don't want null values in our JSON schema.

### Caveats of Null Population when using `exclude_value`
If a field is an array of values, (eg. `[1, 2, 3]`) we will not update those values. This is because
removing values from the array could have consequences on our logic. If we remove records from an array
list, then our indexing logic would be made incredibly complex. As we are unlikely to pre/post populate
fields directly into an array, it has been deemed better to not support the case for now.

NOTE: If you had data like `{"my_array": [{"x": 4}, {"x": 5}]}` and ran a rule on `my_array[*].x` to set a value to null,
that would work as we can change the values in the objects within an array uneventfully. We just don't
want to be adding or removing items themselves from the array. This would result in `{"my_array": [{}, {}]}`

## Monetary Summation
We support the ability to sum monetary amounts together. This rule requires that you
specify which fields to sum together like so:
```json
{
  "my_field": {
    "gg_pre_population": {
      "rule": "sum_monetary",
      "fields": ["@THIS.x", "a[*].y"]
    }
  }
}
```

For details on how the fields parameter works, see the Fields section below.

A few important details about our summation logic:
* We will always populate the configured field, if no fields fetched are populated, "0.00" will be populated.
* Any null-field is treated as "0.00".


NOTE: Only monetary summation is supported right now. All math done by this summing
logic assumes the input values are strings of the format "0.00". If we need to support
summing integers or other numeric types, we'll need to add a separate rule for those.

## Fields
Some rules like our `sum_monetary` rule allow you to specify fields that
serve as the input to the rule. These fields can be specified as either
absolute or relative paths. Additionally, the fields can contain
array paths (eg. `my_field[*].x` which says to fetch all x's in the my_field array)
so a field can actually refer to multiple values.

Our field fetching logic only fetches values that exist, if a field is
not yet populated, or an array is empty, it will return nothing. How the
rules use that can vary.

### Absolute Fields
These are defined as the full path from the root of the object to whatever
field you want to fetch. All of the following would be absolute fields:
* `x.y.z`
* `my_array[*].a.b`
* `a[*].b[*].c[*].d`

Absolute fields work as you expect, and should handle most simple cases.

### Relative Fields
A relative field is relative to the value where the rule is configured.
You can specify a relative field by starting it with `@THIS` to indicate
that you want the path defined as relative to wherever you are in the schema.
This can be useful when dealing with arrays as if you have an array where
you want a field to reference the same array item you are already in, you
don't need to worry about how the indexes of that array work.

For example assume the following data and rule:

```json
{
  "my_array": [
    {"my_nested_obj":  {"x": "100.00", "y": "200.00"}},
    {"my_nested_obj":  {"x": "300.00", "y": "400.00"}},
    {"my_nested_obj":  {"x": "500.00", "y": "600.00"}}
  ]
}
```

```json
{
  "my_array": {
    "gg_type": "array",
    "my_nested_obj": {
      "total": {
        "gg_pre_population": {
          "rule": "sum_monetary",
          "fields": ["@THIS.x", "@THIS.y"]
        }
      }
    }
  }
}
```
Specifying it with relative paths lets us make each array item calculate
its own separate sum. Without relative paths, we wouldn't have a good way
to specify what amounts to:
* `my_array[0].my_nested_obj.x` + `my_array[0].my_nested_obj.y`
* `my_array[1].my_nested_obj.x` + `my_array[1].my_nested_obj.y`
* `my_array[2].my_nested_obj.x` + `my_array[2].my_nested_obj.y`


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

## Cross-field Validation
We likely want some form of cross-field validation. I don't think
JSON Schema supports a way to validate dates are in order for something
like start/end dates.
