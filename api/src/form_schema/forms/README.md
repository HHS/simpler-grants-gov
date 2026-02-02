# Overview
This folder contains the JSON backing the forms that
we currently support. This is a very simple approach
to organization of the forms, and likely won't be
the approach we take long-term past the pilot.

# How to rebuild a form from grants.gov

## Required files
We need to collect several files in order to build a form.
Several of these can be found by finding the form on
https://grants.gov/forms/forms-repository/ and going to the
FID page for the form.

### .dat
The .dat file can be downloaded on the FID page. The FID
page also contains the .dat information.

This contains a description of each field in the form
including validation rules and conditionally required rules
like whether a field is only required when a different field
is answered a certain way.

### PDF
The PDF file can be downloaded on the FID page.

This can be very helpful in confirming your understanding
of how fields work as you can see the behavior of validation,
conditionally required fields, and is a great visual aid
that should be used as a good way of resolving any inconsistencies
you see between other files.

### .xsd Schema
The .xsd schema can be downloaded on the FID page.

This defines the schema of the underlying data of
a form in grants.gov. We need to make sure that every
answerable field in this gets translated into our JSON schema
in some form. We should generally try to keep the same
general structure as the XSD schema, although this
is not 100% required as we can fix the shape when
we have to transform it back.

Sometimes we may exclude fields from the xsd in our JSON
schema if the value is static, or a duplicate of another field.

### Instructions
The instructions can be downloaded on the FID page.

Some forms do not have instructions. The instructions
will need to be re-uploaded in our system, and can help
you better understand the behavior of fields.

### Form information
We have to fetch extra form information from grants.gov's database
in order to properly populate information below.

Ask other engineers for the latest copy of our form information.

### Pre/post-population rules
Pre/post population rules are partially defined in a database table
in grants.gov called `TWORKSPACE_POP_REF`. We'll need to collect
rules from that for a given form.

Ask other engineers for the latest copy of this information.

## Information to collect
Our forms require the following information to create:
* `form_id` - a static UUID, generate a new one for the form
* `legacy_form_id` - Integer, pulled from legacy system, can get from the end of the URL of the FID page.
* `form_name` - String, the `description` from the form information. While it also has a `formname` in grants.gov, that's not usually as human-friendly as the grants.gov.
* `short_form_name` - String, the `shortformname` from the form information
* `form_version` - String, the `version` from the form information, can also see it in the FID page.
* `agency_code` - `SGG` - At the moment, we say all forms are owned by our own `Simpler Grants.gov` agency
* `omb_number` - String, the `ombnumber` from the form information.
* `form_json_schema` - JSON - this is the largest component to build and is described further below.
* `form_ui_schema` - JSON - this is configured by our frontend engineers.
* `form_rule_schema` - JSON - this contains an optional set of pre/post/other validation rules, further described below.
* `json_to_xml_schema` - JSON - this contains rules on how to transform the JSON into XML to be compatible with grants.gov's form data format, further described below.
* `form_instruction_id` - UUID - this is necessary if a form has instructions, null otherwise. When updating a form in an environment, you'll first need to upload the attachments, further described below.
* `form_type` - FormType enum - This should be used to group forms of different versions together. Generally just name this similar to the short form name without any version info.
* `sgg_version` - `1.0` - represents a version of a form in our system, all our forms will start at `1.0`
* `is_deprecated` - `False` - this represents whether a form is deprecated, if it's a new form, it won't be deprecated

## Building the JSON Schema
The JSON schema is by far the most complex part of setting up a form
as it needs to contain most of the information about a form, specifically
all of the fields within the form, their validations, as well as conditional
validations.

We do have a utility for turning a .dat file into a very rough
JSON schema, although it's still going to require quite a bit of work to setup
and in many cases you'll need to do the JSON schema setup manually.
If you want to use the utility, make sure you have the .dat file for the JSON schema
and run: `make dat-to-jsonschema args="~/Downloads/SF424_4_0-V4.0_F713.xls" > out.txt`
specifying whatever dat file you downloaded.

When building JSON schemas, a few important things to keep in mind:
* If a field is a commonly used field (like an address or name), use the shared schema.
This will save you time as you don't need to redefine entire parts of the data model.
* If a part of the schema repeats, but isn't something that would be used outside of
the form you are working on, put it in the "$defs" section to be reusable.
* Keep naming consistent, don't worry about how the fields are named in the XML if they
go against our conventions. Use `snake_case` for field names.
* Unit tests are vital to making sure the schema is defined correctly.
It can help to first start by defining what the JSON data will look like
in a test and then make the schema that validates it as correct.

### Shared Schema
We define many fields in a shared schema. These are field types that
get reused in many different places in our schemas as they represent
common types like addresses or names.

You can use the shared schema when defining a form schema by doing the
following:

```python
from src.form_schema.shared import ADDRESS_SHARED_V1

MY_EXAMPLE_SCHEMA = {
    "type": "object",
    "properties": {
        "my_simple_address": {
            # Whatever field passed into the field_ref function
            # will properly reference that field in the schema
            # A shared schema can contain several different fields
            # that can be imported, this is how you pick which one you want
            "allOf": [{"$ref": ADDRESS_SHARED_V1.field_ref("simple_address")}],
            # Note that you can exclude the title/description, whatever is
            # defined in the referenced schema will be used.
            "title": "My Simple Address",
            "description": "The simple address you need to enter"
        }
    }
}
```
Note that when referencing another field, we put it in an `allOf`. This
is because otherwise the title/description we specify would get overriden
by the reference. `allOf` behaves sorta like inheritance so doing it this way
we'll first grab the address, and then add our own title/description.

If a field looks like it appears in several forms, consider adding it
to a shared schema. This will save more time as we build out future forms
as we will need to

### Some helpful JSON schema tips
The [JSON schema reference](https://json-schema.org/understanding-json-schema/reference) is a great starting place
for furthering your understanding of JSON schema and contains many examples.

#### Attachments
The way we handle attachments is much different than the way they're
specified in the XML. For an attachment field, we define them as
a simple UUID field (an array is also acceptible for a multi-attachment field)
like so:

```python
from src.form_schema.shared import COMMON_SHARED_V1

MY_EXAMPLE_SCHEMA = {
    "type": "object",
    "properties": {
        "single_attachment": {
            "allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}],
            "title": "My Single Attachment",
            "description": "Please add an attachment to explain your situation"
        },
        "array_attachment": {
            "type": "array",
            "title": "My array attachment",
            "description": "Add several attachments to explain",
            "maxItems": 100, # Good to add a limit to the number of files
            "items": {"allOf": [{"$ref": COMMON_SHARED_V1.field_ref("attachment")}]},
        }
    }
}
```

Additionally, when defining the rule schema YOU MUST add
a rule to validate the attachment. This is required to account
for certain scenarios where a user could have deleted an attachment,
but it still exist in the answers they gave on a form.

```python
FORM_RULE_SCHEMA = {
    "single_attachment": {"gg_validation": {"rule": "attachment"}},
    "array_attachment": {"gg_validation": {"rule": "attachment"}},
}
```

#### Figuring out validations required
Determining what validations we need to add to a field can be tricky.
Most validations fall into one of a few categories:
* Field length (min and/or max)
* Pattern/regex matching
* Formats (date, email, uuid)
* Whether the field is required (or conditionally required)
* Allowed values (enumerations)

Most of this information can be parsed from:
* The .xsd / XML schema
* The .dat / FID page
* Testing out the behavior in the PDF form

##### Parsing the .xsd
The XML schema is good for determining many of the field restrictions.
Here are a few examples, and how to interpret them.

Many fields refer to types that are defined in other schemas. For example
it's not uncommon for a field like an address to have fields defined like
```xml
<xs:element name="Street1" type="globLib:StreetDataType"/>
```
This is saying that the type of the object can be pulled from the globLib
namespace (namespaces are defined at the top of the schema generally and including a link)
and to check that file.

If we go to the GlobalLibrary schema, we find that field defined as:
```xml
<xs:simpleType name="StreetDataType">
    <xs:restriction base="xs:string">
        <xs:minLength value="1"/>
        <xs:maxLength value="55"/>
    </xs:restriction>
</xs:simpleType>
```
This defines a min and max length of the field and gives its basic type. We
can easily translate these values into a JSON schema.

---

If a field represents an enumeration, it defines the values like so:
```xml
<xs:simpleType name="RevisionCodeDataType">
    <xs:restriction base="xs:string">
        <xs:enumeration value="A: Increase Award"/>
        <xs:enumeration value="B: Decrease Award"/>
        <xs:enumeration value="C: Increase Duration"/>
        <xs:enumeration value="D: Decrease Duration"/>
    </xs:restriction>
</xs:simpleType>
```
Where the 4 possible values can be pulled from the enumeration array.

---

A field with a pattern/regex might look like:
```xml
<xs:simpleType name="SocialSecurityNumberDataType">
    <xs:restriction base="xs:string">
        <xs:pattern value="[0-9]{3}\-[0-9]{2}\-[0-9]{4}"/>
    </xs:restriction>
</xs:simpleType>
```

---

Whether a field is required is based on the `minOccurs` attribute.
If this value is set as `minOccurs="0"` then the field is NOT required.
If the value is greater than 0 or not present at all then the field IS required.

For example, this would be a required field because `minOccurs` is missing.
```xml
<xs:element name="Street1" type="globLib:StreetDataType"/>
```

##### Parsing the .dat
The .dat / FID file explains field validations, and is
generally pretty understandable, providing min/max lengths,
allowed values, and any business rules.

The most important one to keep an eye out for are conditionally
required field rules. This is the main place we can find that information
as the only other place it's really defined is in the PDFs.

However, be careful as there are some rules that grants.gov
might have that we don't yet have any corresponding behavior yet.
The .dat often describes how fields populate from another form
(most often pulling values from the SF424 or similar). We don't
have that support, so those fields will require a user to populate
even if the .dat says a user can't touch them.

#### Conditionally required fields
Let's assume we have a form with two questions, one that asks
a multi-select question, and another that if you answered "other"
it would become required. To specify that the second question is conditionally
required you could have a JSON schema like so:

```python
MY_EXAMPLE_JSON_SCHEMA = {
    "type": "object",
    "required": [
        # Only the select field is required by default
        "my_select_field"
    ],
    "properties": {
        "my_select_field": {
            "type": "string",
            "title": "My Select Field",
            "description": "A field that can be selected!",
            "enum": ["Yes", "No", "Other"]
        },
        "my_select_field_other": {
            "type": "string",
            "title": "My Select Field Other",
            "description": "Answer this if you said 'Other' to the above question"
        }
    },
    # Define conditionally required fields in an "allOf"
    # otherwise we can only have a single one on the whole schema.
    # This just makes it a list of if/then/else
    "allOf": [
        # If my_select_field is Other, my_select_field_other becomes required
        {
            "if": {
                # This basically says 'if my_select_field == "Other"'
                "properties": {"my_select_field": {"const": "Other"}},
                # Required here makes it so the rule only runs if my_select_field is set
                # which avoids some odd behavior otherwise. Should generally always include the field you're checking
                "required": ["my_select_field"]
            },
            # This says to add anything in the list to the required on the object
            # Multiple fields can be specified
            # If we instead wanted to change other behavior (adding a regex) that is also doable
            "then": {"required": ["my_select_field_other"]}
        }
    ]
}
```

## Building the rule schema
We currently have 3 groups of rules:
* Pre-population - fields we populate when a user starts OR updates an application form
* Post-population - fields we populate only when a user submits an application form
* Validation - fields we validate with custom rules that can't be expressed in JSON schema

For details on how these rules work, and how to configure them,
see the [Rule Processing README](../rule_processing/README.md)

To know which rules we need to add, we need to consult the
pre/post-population documentation. In this we need to find
which fields that grants.gov populated for a given form. We
should generally support most of the rules already, note that
they called pre-population `CORE` and post-population `POST`.
This document contains many cross-form population rules as well
that we don't yet support.

However, this doesn't contain all population rules, as any
auto-summation isn't defined in this. That type of rule can really
only be found by figuring out the behavior from the PDF. Consult
with product and confirm the behavior we want for any auto-summed fields.

## Building the XML Conversion Schema
We have a configuration for each form to convert it to the XML format
that grants.gov used. This is further documented in [xml_generation](/api/src/services/xml_generation/README.md)

## Deploying a form
We deploy forms to a given environment using a set of scripts.
This is documented in [task/forms/README.md](/api/src/task/forms/README.md)
