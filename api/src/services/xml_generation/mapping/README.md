# XML mapping format

Every hand-written form's XML configuration is transform rules keyed by the JSON response,
described in [the main README](../README.md#configuration). A form defined in `forms/` can
instead use a mapping shaped like the XML, `xml_mapping.json`. `XMLGenerationService` hands a
configuration with `"format": "xml-mapping"` to the generator in
[`generator.py`](generator.py), and every other form takes the current path, unchanged.

The form library emits these mappings from `forms/specs/`. The XML parity checks in
`tests/src/form_schema/parity/` check them against the form's JSON Schema and its XSD, the
same as transform rules.

## The document

A mapping is the XML document's tree. Each key is an element or attribute, and each value says
where its content comes from:

```json
{
  "format": "xml-mapping",
  "namespaces": {
    "default": "http://apply.grants.gov/forms/Key_Contacts_2_0-V2.0",
    "Key_Contacts_2_0": "http://apply.grants.gov/forms/Key_Contacts_2_0-V2.0",
    "globLib": "http://apply.grants.gov/system/GlobalLibrary-V2.0"
  },
  "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/Key_Contacts_2_0-V2.0.xsd",
  "root": {
    "Key_Contacts_2_0": {
      "@Key_Contacts_2_0:FormVersion": { "$const": "2.0" },
      "ApplicantOrganizationName": { "$field": "applicant_organization_name" }
    }
  }
}
```

```xml
<Key_Contacts_2_0:Key_Contacts_2_0 xmlns:Key_Contacts_2_0="http://apply.grants.gov/forms/Key_Contacts_2_0-V2.0" xmlns:globLib="http://apply.grants.gov/system/GlobalLibrary-V2.0" Key_Contacts_2_0:FormVersion="2.0">
  <Key_Contacts_2_0:ApplicantOrganizationName>Acme Corporation</Key_Contacts_2_0:ApplicantOrganizationName>
</Key_Contacts_2_0:Key_Contacts_2_0>
```

- **`namespaces`:** every namespace the document declares, by prefix. `default` is the form's
  own, and one of the prefixes must declare it too.
- **`root`:** one key, the root element.
- **Element keys:** a key without a prefix, like `ApplicantOrganizationName`, is in the form's
  namespace. One from another namespace carries its prefix, like `globLib:FirstName`.
- **Attribute keys:** these start with `@` and always carry a prefix, like
  `@Key_Contacts_2_0:FormVersion`, because a default namespace doesn't apply to attributes.
- **Order:** elements are written in the mapping's key order, which is the XSD's sequence.
- **Functions:** a key starting with `$` is one of the functions below; every other key is
  something to write. The same vocabulary describes JSON and CSV mappings, whose keys follow
  no naming rule of their own, so only the `$` tells the two apart. A `$` key that isn't a
  function is an error.
- **Groups:** a value that isn't a function is a group of child elements. A wrapper with no
  data of its own, like `<Profile>`, is just a key with its children under it.

## Values

### `$field`: the answer at a path

A dotted path into the response. Inside `$each`, the path is relative to the item.

```json
"ContactName": {
  "globLib:FirstName": { "$field": "name.first_name" },
  "globLib:LastName": { "$field": "name.last_name" }
}
```

```xml
<Key_Contacts_2_0:ContactName>
  <globLib:FirstName>Jane</globLib:FirstName>
  <globLib:LastName>Smith</globLib:LastName>
</Key_Contacts_2_0:ContactName>
```

A whole-number step reads a list's entry by index, for an XSD that numbers its elements
instead of repeating one. An entry the list doesn't have writes nothing.

```json
"ApplicantTypeCode1": { "$field": "applicant_type_code.0" },
"ApplicantTypeCode2": { "$field": "applicant_type_code.1" },
"ApplicantTypeCode3": { "$field": "applicant_type_code.2" }
```

### `$const`: a fixed value

```json
"@PerformanceSite_4_0:FormVersion": { "$const": "4.0" }
```

### `$transform`: a value changed by a named function

`name` is a function in `value_transformers.TRANSFORMATION_REGISTRY`, so the API's existing
transforms and their errors apply. `params` is passed to it as it is.

```json
"Individual": {
  "$transform": {
    "name": "boolean_to_yes_no",
    "value": { "$field": "primary_site.submitting_as_individual" }
  }
}
```

```xml
<PerformanceSite_4_0:Individual>N: No</PerformanceSite_4_0:Individual>
```

### `$match`: a lookup from answers to values

Writes the `case` entry for the answer, or `default` for an answer `case` doesn't list. An
answer with neither is an error. `case` keys are strings, as JSON object keys always are, so a
non-string answer is keyed as JSON writes it: `true` as `"true"`, `1` as `"1"`.

```json
"StateReview": {
  "$match": {
    "value": { "$field": "state_review" },
    "case": {
      "a": "a. This application was made available to the State under the Executive Order 12372 Process for review on",
      "b": "b. Program is subject to E.O. 12372 but has not been selected by the State for review.",
      "c": "c. Program is not covered by E.O. 12372."
    }
  }
}
```

For an answer of `"c"`:

```xml
<SF424_4_0:StateReview>c. Program is not covered by E.O. 12372.</SF424_4_0:StateReview>
```

### `$attachment`: an uploaded file

The path names the upload's id. The element holds the file's name, type, location and hash, as
an `att:AttachedFileDataType`, from the submission's attachment records. It works at any depth,
including inside `$each`.

```json
"AttachedFile": { "$attachment": "additional_locations_attachment" }
```

```xml
<PerformanceSite_4_0:AttachedFile>
  <att:FileName>additional_locations.pdf</att:FileName>
  <att:MimeType>application/pdf</att:MimeType>
  <att:FileLocation att:href="additional_locations.pdf"/>
  <glob:HashValue glob:hashAlgorithm="SHA-1">aeB1+6gdFwih51ijIRn3b8QYn24=</glob:HashValue>
</PerformanceSite_4_0:AttachedFile>
```

An id the submission has no record for is an error, the same as in transform rules.

### `$each`: one element per item of a list

Writes the element once per item of the list at `items`, with `map` as its content. Paths in
`map` are relative to the item.

```json
"KeyPerson": {
  "$each": {
    "items": { "$field": "senior_key_persons" },
    "map": {
      "Profile": {
        "Name": { "globLib:FirstName": { "$field": "profile.name.first_name" } },
        "BioSketchsAttached": {
          "BioSketchAttached": { "$attachment": "profile.biographical_sketch" }
        }
      }
    }
  }
}
```

```xml
<RR_KeyPerson_3_0:KeyPerson>
  <RR_KeyPerson_3_0:Profile>
    <RR_KeyPerson_3_0:Name>
      <globLib:FirstName>Ada</globLib:FirstName>
    </RR_KeyPerson_3_0:Name>
    <RR_KeyPerson_3_0:BioSketchsAttached>
      <RR_KeyPerson_3_0:BioSketchAttached>
        <att:FileName>ada-biosketch.pdf</att:FileName>
        ...
      </RR_KeyPerson_3_0:BioSketchAttached>
    </RR_KeyPerson_3_0:BioSketchsAttached>
  </RR_KeyPerson_3_0:Profile>
</RR_KeyPerson_3_0:KeyPerson>
<RR_KeyPerson_3_0:KeyPerson>
  ...
</RR_KeyPerson_3_0:KeyPerson>
```

### `$when`: content that depends on another answer

Writes `then` when `condition` holds, and otherwise `else`, or nothing without one. `then` and
`else` can be any value: a group of elements, a `$field`, an `$each` or another `$when`.

```json
"MaterialChangeSupplement": {
  "$when": {
    "condition": { "field": "report_type", "operator": "equals", "value": "MaterialChange" },
    "then": {
      "MaterialChangeYear": { "$field": "material_change_year" },
      "MaterialChangeQuarter": { "$field": "material_change_quarter" }
    }
  }
}
```

The operators are:

| Operator | Holds when the answer at `field`… |
| --- | --- |
| `equals` | equals `value` |
| `not_equals` | doesn't equal `value` |
| `in` | is one of the list `value` |
| `exists` | is present and not empty |

`all` and `any` combine conditions:

```json
"condition": {
  "all": [
    { "field": "report_type", "operator": "equals", "value": "MaterialChange" },
    { "field": "material_change_year", "operator": "exists" }
  ]
}
```

### `$required`: an element written even when it's empty

Writes its value, or an empty element when the value has nothing to write. It's for an element
the XSD requires that the form may leave unanswered, which transform rules write with
`null_handling: include_null`.

```json
"DateReceived": { "$required": { "$field": "date_received" } }
```

With no `date_received`:

```xml
<SF424_4_0:DateReceived/>
```

## Nesting

Every input to a function is itself a value, so functions nest. A `case` entry, `default`,
`then` or `else` can be any value, including a group of elements; a plain string, number or
boolean there means `$const`. `$each` reads its list from any value that yields one.

```json
"Status": {
  "$match": {
    "value": { "$field": "status" },
    "case": {
      "open": "Open",
      "closed": {
        "$when": {
          "condition": { "field": "closure_reason", "operator": "exists" },
          "then": { "$field": "closure_reason" },
          "else": "Closed"
        }
      }
    }
  }
}
```

| Answers | Writes |
| --- | --- |
| `{"status": "open"}` | `<Status>Open</Status>` |
| `{"status": "closed", "closure_reason": "Withdrawn"}` | `<Status>Withdrawn</Status>` |
| `{"status": "closed"}` | `<Status>Closed</Status>` |

A function's own arguments (`value`, `case`, `default`, `items`, `map`, `condition`, `then`,
`else`, `name`, `params`) and a condition's keys (`field`, `operator`, `value`, `all`, `any`)
take no `$`: they only ever appear inside a function.

## Elements with nothing to write

An element whose value is missing or empty is left out, and so is a group none of whose
elements has anything to write, unless it's `$required`. Most conditional sections need no `$when`: an address with no
answers, for example, writes no `<Address>` at all.
