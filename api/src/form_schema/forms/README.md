# Overview
This folder contains the JSON backing the forms that
we currently support. This is a very simple approach
to organization of the forms, and likely won't be
the approach we take long-term past the pilot.


# How to Build
To build the JSON schema, you need a few things from the existing system for a given form:
* The .dat file
* The XML/.xsd schema
* The fillable PDF

All of these can be found under https://grants.gov/forms/forms-repository/ - for example
for building out the SF424, you can find all of the relevant links on the "Form Item Descriptions"
page: https://grants.gov/forms/form-items-description/fid/713


Actually building out the JSON schema is mostly manual, but we have a utility
that can at least help with getting most of the fields pulled into something.
Running the `make dat-to-jsonschema` command and passing it the .dat file
will at least give you a very, very rough schema.
`make dat-to-jsonschema args="~/Downloads/SF424_4_0-V4.0_F713.xls" > out.txt`

It does not however get a valid JSON schema, and you will need to go field-by-field
and fix the schema. A few callouts:
* The dat often contains fields that are actually labels OR actually represent a complex type, look at how the XSD and PDF represent the data
* The types don't line up exactly, check all of them, especially fields like monetary amounts and attachments which work different in our system
* Look thoroughly at the XML/.xsd file, it provides more validation details than the .dat
* Conditionally required fields (if X == Y, then Z is required), are defined on the form-item-description page and need to be built manually
* The title/description fields are used by our UI, they almost certainly need to be rewritten completely from what the .dat file put
* Common or nested fields should be defined in the `$defs` section

### Reading the .xsd file
A few tips:
* Many fields reference/import types. The files they import from are at the top of the XSD, but mostly those types are defined in https://apply07.grants.gov/apply/system/schemas/GlobalLibrary-V2.0.xsd
* If a field has `minOccurs="0"` and no maxOccurs, it means the field is not required (at least by default, conditional validation may change that)
* Many string fields have a min and max length defined, copy those to our schema

# Future Ideas/Work
* Common Schemas - Having a central/common schema instead of our current approach of putting everything a schema needs into that single schema.
* An approach to developing and managing the deployment of schemas
