# Form library tutorial: from plan to live form

This tutorial walks a new contributor through the whole lifecycle of a form, from planning it to seeing it in the apply experience. You'll rebuild **Key Contacts** (Grants.gov form 683) under a new id, `key-contacts-tutorial`, so nothing you do touches the real Key Contacts form.

By the end you'll have:

1. Written a **form plan** that matches the Grants.gov DAT and XSD.
2. Written a **form specification** in TypeSpec and previewed it.
3. **Mapped** the form to its XSD, so the API can write its submission XML.
4. Broken a check on purpose, recorded the difference, and seen what happens when a record goes stale.
5. Swapped your contact fields for the **question bank's** standard ones, and handled the trade-off that creates.
6. **Installed** the form into the API with `@Sgg.sync`, and opened it in the frontend.

Every command and file in this guide was run as written. The outputs shown are real, trimmed to the relevant lines.

## Concepts

| Term | What it is | Where it lives |
|---|---|---|
| **DAT** | Grants.gov's Data Attribute Table: a spreadsheet listing every field's label, help text, requiredness and length. | Downloaded by `npm run parity:fetch` |
| **XSD** | The XML schema a submission has to validate against. | Downloaded by `npm run parity:fetch` |
| **Form plan** | Our requirements for a form: each field's label, help text, constraints and how it links to the DAT (`dat_field`), the XSD (`xml_path`) and the form's data (`json_path`). | `site/src/content/forms/<slug>.json` |
| **Form specification** | The form itself, in TypeSpec: its data model (`form.tsp`), how it's laid out (`layout.tsp`) and how it maps to the XSD (`xsd.tsp`). | `specs/forms/<id>/` |
| **Question bank** | Reusable questions, like a person's name or address, shared across forms so they're worded and validated the same way everywhere. | `specs/questions/` |
| **Parity checks** | Tests that compare the plan with the DAT and XSD (*requirements*), the compiled form with the plan (*implementation*), and the XML mapping with the XSD (*XML*). | `parity/` |
| **Recorded differences** | Known, accepted differences, each with a category (`upstream`, `intentional` or `gap`) and a reason. | `parity/diffs/<slug>.ts` |

See [`parity/README.md`](../parity/README.md) for every check the suite runs.

## Before you start

You'll need Node 22 or 24, and a network connection the first time you run the parity suite, since it downloads the DAT and XSD from Grants.gov. Step 6 also needs the API and frontend running locally (see [API development](../../documentation/api/development.md)).

All commands run from `forms/` unless a step says otherwise.

```bash
npm ci
(cd site && npm ci)
npm run compile        # compile every form specification into dist/
npm run test:parity    # download the Grants.gov sources, then run every parity check
```

Everything should pass before you start:

```text
 Test Files  11 passed (11)
      Tests  293 passed | 10 todo (303)
```

Keep the form library running in a second terminal while you work. Starting it deletes `dist/` and compiles every form from scratch. After that, nothing compiles on its own: reload the page after a change to a plan or a `parity/diffs/` file, and run `npm run compile` first after a change to a form specification. `npm run compile` only adds to `dist/`, so after deleting or renaming a form, run `npm run clean && npm run compile`.

```bash
cd site && npm run dev    # http://localhost:4321
```

The tutorial form's page, `/forms/key-contacts-tutorial/`, appears once you add its plan in step 1.1.

To run only this tutorial's checks:

```bash
npx vitest run parity -t key-contacts-tutorial
```

---

## Step 1: Write the form plan

**Goal:** a plan that says exactly what Grants.gov says, so every requirements check passes.

### 1.1 Add the plan

Create the plan file:

```bash
touch site/src/content/forms/key-contacts-tutorial.json
```

Then paste this in:

<details>
<summary><code>key-contacts-tutorial.json</code></summary>

```json
{
  "title": "Key Contacts (Tutorial)",
  "slug": "key-contacts-tutorial",
  "omb_number": "4040-0010",
  "expiration_date": "08/31/2029",
  "fid_url": "https://www.grants.gov/forms/form-items-description/fid/683",
  "pdf_url": "https://apply07.grants.gov/apply/forms/readonly/Key_Contacts_2_0-V2.0_F683.pdf",
  "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/Key_Contacts_2_0-V2.0.xsd",
  "dat_url": "https://apply07.grants.gov/apply/forms/sample/Key_Contacts_2_0-V2.0_F683.xls",
  "status": "in_progress",
  "category": "Key Personnel & Contact Forms",
  "description": "A copy of Key Contacts for the form library tutorial. Its labels and help text follow the Grants.gov DAT word for word.",
  "children": [
    {
      "kind": "section",
      "label": "Applicant Information",
      "widget": "FieldsetWidget",
      "children": [
        {
          "kind": "field",
          "label": "Applicant Organization Name",
          "dat_field": "5",
          "required": true,
          "type": "Text input",
          "widget": "TextWidget",
          "help_text": "Enter the legal name of the applicant that will undertake the assistance activity. This field is required.",
          "constraints": "minLength 1, maxLength 60",
          "json_path": "applicant_organization_name",
          "xml_path": "Key_Contacts_2_0:ApplicantOrganizationName"
        }
      ]
    },
    {
      "kind": "section",
      "label": "Key Contacts",
      "min_items": 1,
      "max_items": 4,
      "json_path": "key_contacts",
      "xml_path": "Key_Contacts_2_0:RoleOnProject",
      "widget": "FieldListWidget",
      "children": [
        {
          "kind": "field",
          "label": "Contact 1 Project Role",
          "dat_field": "7-01",
          "required": true,
          "type": "Text input",
          "widget": "TextWidget",
          "help_text": "Enter the project role of the contact person (e.g., project manager, fiscal contact). Additional contacts are optional.",
          "constraints": "minLength 1, maxLength 45",
          "json_path": "key_contacts[].project_role",
          "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactProjectRole"
        },
        {
          "kind": "section",
          "label": "Name",
          "json_path": "key_contacts[].name",
          "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactName",
          "widget": "FieldsetWidget",
          "children": [
            {
              "kind": "field",
              "label": "Prefix",
              "dat_field": "7-03",
              "required": false,
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Select the Prefix from the provided list or enter a new Prefix not provided on the list.",
              "constraints": "minLength 1, maxLength 10",
              "json_path": "key_contacts[].name.prefix",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactName/globLib:PrefixName"
            },
            {
              "kind": "field",
              "label": "First Name",
              "dat_field": "7-04",
              "required": true,
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Enter the First Name. This field is required.",
              "constraints": "minLength 1, maxLength 35",
              "json_path": "key_contacts[].name.first_name",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactName/globLib:FirstName"
            },
            {
              "kind": "field",
              "label": "Middle Name",
              "dat_field": "7-05",
              "required": false,
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Enter the Middle Name.",
              "constraints": "minLength 1, maxLength 25",
              "json_path": "key_contacts[].name.middle_name",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactName/globLib:MiddleName"
            },
            {
              "kind": "field",
              "label": "Last Name",
              "dat_field": "7-06",
              "required": true,
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Enter the Last Name. This field is required.",
              "constraints": "minLength 1, maxLength 60",
              "json_path": "key_contacts[].name.last_name",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactName/globLib:LastName"
            },
            {
              "kind": "field",
              "label": "Suffix",
              "dat_field": "7-07",
              "required": false,
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Select the Suffix from the provided list or enter a new Suffix not provided on the list.",
              "constraints": "minLength 1, maxLength 10",
              "json_path": "key_contacts[].name.suffix",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactName/globLib:SuffixName"
            }
          ]
        },
        {
          "kind": "field",
          "label": "Title",
          "dat_field": "7-08",
          "required": false,
          "type": "Text input",
          "widget": "TextWidget",
          "help_text": "Enter the position title.",
          "constraints": "minLength 1, maxLength 45",
          "json_path": "key_contacts[].title",
          "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactTitle"
        },
        {
          "kind": "field",
          "label": "Organizational Affiliation",
          "dat_field": "7-09",
          "required": false,
          "type": "Text input",
          "widget": "TextWidget",
          "help_text": "Enter the Organizational Affiliation of the person to contact on matters related to this application.",
          "constraints": "minLength 1, maxLength 60",
          "json_path": "key_contacts[].organizational_affiliation",
          "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactOrganizationalAffiliation"
        },
        {
          "kind": "section",
          "label": "Address",
          "json_path": "key_contacts[].address",
          "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactAddress",
          "widget": "FieldsetWidget",
          "children": [
            {
              "kind": "field",
              "label": "Street1",
              "dat_field": "7-10",
              "required": true,
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Enter the first line of the Street Address. This field is required.",
              "constraints": "minLength 1, maxLength 55",
              "json_path": "key_contacts[].address.street1",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactAddress/globLib:Street1"
            },
            {
              "kind": "field",
              "label": "Street2",
              "dat_field": "7-11",
              "required": false,
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Enter the second line of the Street Address.",
              "constraints": "minLength 1, maxLength 55",
              "json_path": "key_contacts[].address.street2",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactAddress/globLib:Street2"
            },
            {
              "kind": "field",
              "label": "City",
              "dat_field": "7-12",
              "required": true,
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Enter the City. This field is required.",
              "constraints": "minLength 1, maxLength 35",
              "json_path": "key_contacts[].address.city",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactAddress/globLib:City"
            },
            {
              "kind": "field",
              "label": "County",
              "dat_field": "7-13",
              "required": false,
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Enter the County.",
              "constraints": "minLength 1, maxLength 30",
              "json_path": "key_contacts[].address.county",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactAddress/globLib:County"
            },
            {
              "kind": "field",
              "label": "State",
              "dat_field": "7-14",
              "required": "Conditional (when Country = 'USA')",
              "type": "Dropdown",
              "widget": "SelectWidget",
              "help_text": "Select the state, US possession or military code from the provided list. This field is required if Country is the United States.",
              "constraints": "StateCodeDataTypeV3",
              "json_path": "key_contacts[].address.state",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactAddress/globLib:State"
            },
            {
              "kind": "field",
              "label": "Province",
              "dat_field": "7-15",
              "required": false,
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Enter the Province.",
              "constraints": "minLength 1, maxLength 30",
              "json_path": "key_contacts[].address.province",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactAddress/globLib:Province"
            },
            {
              "kind": "field",
              "label": "Country",
              "dat_field": "7-16",
              "required": true,
              "type": "Dropdown",
              "widget": "SelectWidget",
              "help_text": "Select the Country from the provided list. This field is required.",
              "constraints": "CountryCodeDataTypeV3",
              "json_path": "key_contacts[].address.country",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactAddress/globLib:Country"
            },
            {
              "kind": "field",
              "label": "Zip / Postal Code",
              "dat_field": "7-17",
              "required": "Conditional (when Country = 'USA')",
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Enter the Postal Code (e.g., ZIP code). This field is required if Country is the United States.",
              "constraints": "minLength 1, maxLength 30",
              "json_path": "key_contacts[].address.zip_code",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactAddress/globLib:ZipPostalCode"
            }
          ]
        },
        {
          "kind": "field",
          "label": "Telephone Number",
          "dat_field": "7-18",
          "required": true,
          "type": "Text input",
          "widget": "TextWidget",
          "help_text": "Enter the daytime Telephone Number. This field is required.",
          "constraints": "minLength 1, maxLength 25",
          "json_path": "key_contacts[].phone",
          "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactPhone"
        },
        {
          "kind": "field",
          "label": "Fax",
          "dat_field": "7-19",
          "required": false,
          "type": "Text input",
          "widget": "TextWidget",
          "help_text": "Enter the Fax Number.",
          "constraints": "minLength 1, maxLength 25",
          "json_path": "key_contacts[].fax",
          "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactFax"
        },
        {
          "kind": "field",
          "label": "Email",
          "dat_field": "7-20",
          "required": true,
          "type": "Text input",
          "widget": "TextWidget",
          "help_text": "Enter a valid Email Address. This field is required.",
          "constraints": "minLength 1, maxLength 60",
          "json_path": "key_contacts[].email",
          "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactEmail"
        }
      ]
    }
  ]
}
```

</details>

Every label and help text is copied from the DAT word for word, and the fields are in the DAT's order. A few things to notice:

- **`dat_field`, `xml_path` and `json_path`** link each field to its row in the DAT, its element in the XSD and its property in the form's data. The checks use them to match fields up.
- **`constraints`** are compared with the XSD. `StateCodeDataTypeV3` and `CountryCodeDataTypeV3` name the XSD's code lists.
- **There's no `spec_id` yet,** because the form doesn't exist. Until it has one, only the requirements checks run.

### 1.2 Register the plan with the parity suite

Create `parity/diffs/key-contacts-tutorial.ts`, the record of this form's known differences:

```bash
touch parity/diffs/key-contacts-tutorial.ts
```

Paste this in. It records no differences yet:

```ts
import type { FormDiff } from "../harness/model.ts";

export const DIFF: FormDiff = {
  slug: "key-contacts-tutorial",
};
```

Then add it to `DIFFS` in `parity/diffs/index.ts`:

```ts
import { DIFF as keyContactsTutorial } from "./key-contacts-tutorial.ts";

export const DIFFS: FormDiff[] = [
  keyContacts,
  keyContactsTutorial,
  // ...
];
```

### 1.3 Run the checks

```bash
npx vitest run parity -t key-contacts-tutorial
```

Two checks fail. The second is the form library's comparison sheet, which fails whenever any check finds a difference nothing records:

```text
 FAIL  parity/comparison.test.ts > key-contacts-tutorial > shows no unrecorded differences
 FAIL  parity/forms.test.ts > key-contacts-tutorial > Requirements checks > plan vs DAT > plan matches field labels
AssertionError: Labels that differ from the DAT:
  label differs: 7-14 -- plan "State", source "* State"
  label differs: 7-17 -- plan "Zip / Postal Code", source "* Zip / Postal Code"
```

This is an **upstream discrepancy**: Grants.gov disagrees with itself. The DAT puts an asterisk on State and Zip / Postal Code, which means required, but its Required column says "No" and the XSD makes both optional. They're only required for a US address. The plan's `"required": "Conditional (when Country = 'USA')"` counts as optional, so the plan can't match the asterisk. You can't fix this in the plan, so record it.

### 1.4 Record the upstream discrepancy

Replace `parity/diffs/key-contacts-tutorial.ts` with:

```ts
import type { FormDiff, Pinned } from "../harness/model.ts";

/** The DAT stars State and Zip / Postal Code, but its Required column and the XSD make them optional. */
const conditionalStar = (label: string): Pinned => ({
  plan: label,
  source: `* ${label}`,
  category: "upstream",
  reason:
    "The DAT stars State and Zip / Postal Code but marks them not required, and the XSD makes them optional. Its help text requires them only when Country is the United States, so the plan treats them as conditional.",
});

export const DIFF: FormDiff = {
  slug: "key-contacts-tutorial",
  dat: {
    differingLabels: {
      "7-14": conditionalStar("State"),
      "7-17": conditionalStar("Zip / Postal Code"),
    },
  },
};
```

A **pinned** record like this stores both values (`plan` and `source`). If either one changes later, the difference is reported again instead of staying hidden.

### Check

```bash
npx vitest run parity -t key-contacts-tutorial
(cd site && npm run check && npm run lint && npm test && npm run build)
```

Every requirements check passes. The implementation and XML checks are skipped, because there's no form yet.

```text
✓ Requirements checks > plan vs DAT > plan has no missing fields
✓ Requirements checks > plan vs DAT > plan has no extra fields
✓ Requirements checks > plan vs DAT > plan matches field order
✓ Requirements checks > plan vs DAT > plan matches field labels
✓ Requirements checks > plan vs DAT > plan matches field occurrences
✓ Requirements checks > plan vs DAT > plan matches field constraints
✓ Requirements checks > plan vs DAT > plan matches help text
✓ Requirements checks > plan vs XSD > plan has no missing fields
✓ Requirements checks > plan vs XSD > plan has no extra fields
✓ Requirements checks > plan vs XSD > plan matches field occurrences
✓ Requirements checks > plan vs XSD > plan matches field constraints
↓ Implementation checks > ...   (skipped: no spec_id)
```

### See it in the form library

Open `/forms/key-contacts-tutorial/`. The field comparison lists every field beside the DAT, the XSD and the form:

- **DAT and XSD:** every cell matches (✓), except the two State and Zip labels, marked **U** (Upstream) with your reason.
- **Form:** every cell is **–** (Not compared), because there's no form to compare yet.
- **Form preview tab:** disabled.

---

## Step 2: Write the form specification

**Goal:** a TypeSpec form that does what the plan says, so the implementation checks pass. This step deliberately uses **no questions from the question bank**: every field is declared in the form itself. Step 5 shows what changes when you use the shared questions instead.

### 2.1 Add the form

Create the form's folder and its `form.tsp`:

```bash
mkdir -p specs/forms/key-contacts-tutorial && touch specs/forms/key-contacts-tutorial/form.tsp
```

Then paste this in:

<details>
<summary><code>form.tsp</code></summary>

```tsp
import "form-library-xml";
import "simpler-forms";

import "#forms/index.tsp";
import "#questions/types/codes.tsp";

using SimplerForms;

namespace Forms.KeyContactsTutorial;

/** KEY CONTACTS, rebuilt for the form library tutorial. */
@Meta.form(#{ id: "key-contacts-tutorial", formName: "KEY CONTACTS (TUTORIAL)" })
@GrantsGov.form(#{
  legacyFormId: 683,
  shortFormName: "Key_Contacts_Tutorial",
  formVersion: "2.0",
  agencyCode: "SGG",
  ombNumber: "4040-0010",
})
model KeyContactsTutorial {
  /** Enter the legal name of the applicant that will undertake the assistance activity. This field is required. */
  @UI.label("Applicant Organization Name")
  @minLength(1)
  @maxLength(60)
  applicantOrganizationName: string;

  @UI.label("Key Contacts")
  @minItems(1)
  @maxItems(4)
  keyContacts: TutorialKeyContact[];
}

/** One key contact. Every field is declared here rather than taken from the question bank. */
model TutorialKeyContact {
  /** Enter the project role of the contact person (e.g., project manager, fiscal contact). Additional contacts are optional. */
  @UI.label("Contact 1 Project Role")
  @minLength(1)
  @maxLength(45)
  projectRole: string;

  @UI.label("Name")
  name: TutorialContactName;

  /** Enter the position title. */
  @UI.label("Title")
  @minLength(1)
  @maxLength(45)
  title?: string;

  /** Enter the Organizational Affiliation of the person to contact on matters related to this application. */
  @UI.label("Organizational Affiliation")
  @minLength(1)
  @maxLength(60)
  organizationalAffiliation?: string;

  @UI.label("Address")
  address: TutorialContactAddress;

  /** Enter the daytime Telephone Number. This field is required. */
  @UI.label("Telephone Number")
  @minLength(1)
  @maxLength(25)
  phone: string;

  /** Enter the Fax Number. */
  @UI.label("Fax")
  @minLength(1)
  @maxLength(25)
  fax?: string;

  /** Enter a valid Email Address. This field is required. */
  @UI.label("Email")
  @minLength(1)
  @maxLength(60)
  email: string;
}

model TutorialContactName {
  /** Select the Prefix from the provided list or enter a new Prefix not provided on the list. */
  @UI.label("Prefix")
  @minLength(1)
  @maxLength(10)
  prefix?: string;

  /** Enter the First Name. This field is required. */
  @UI.label("First Name")
  @minLength(1)
  @maxLength(35)
  firstName: string;

  /** Enter the Middle Name. */
  @UI.label("Middle Name")
  @minLength(1)
  @maxLength(25)
  middleName?: string;

  /** Enter the Last Name. This field is required. */
  @UI.label("Last Name")
  @minLength(1)
  @maxLength(60)
  lastName: string;

  /** Select the Suffix from the provided list or enter a new Suffix not provided on the list. */
  @UI.label("Suffix")
  @minLength(1)
  @maxLength(10)
  suffix?: string;
}

model TutorialContactAddress {
  /** Enter the first line of the Street Address. This field is required. */
  @UI.label("Street1")
  @minLength(1)
  @maxLength(55)
  street1: string;

  /** Enter the second line of the Street Address. */
  @UI.label("Street2")
  @minLength(1)
  @maxLength(55)
  street2?: string;

  /** Enter the City. This field is required. */
  @UI.label("City")
  @minLength(1)
  @maxLength(35)
  city: string;

  /** Enter the County. */
  @UI.label("County")
  @minLength(1)
  @maxLength(30)
  county?: string;

  /** Select the state, US possession or military code from the provided list. This field is required if Country is the United States. */
  @UI.label("State")
  state?: Questions.Types.StateCode;

  /** Enter the Province. */
  @UI.label("Province")
  @minLength(1)
  @maxLength(30)
  province?: string;

  /** Select the Country from the provided list. This field is required. */
  @UI.label("Country")
  country: Questions.Types.CountryCode;

  /** Enter the Postal Code (e.g., ZIP code). This field is required if Country is the United States. */
  @UI.label("Zip / Postal Code")
  @minLength(1)
  @maxLength(30)
  zipCode?: string;
}
```

</details>

How the plan's fields map to TypeSpec:

| Plan | TypeSpec |
|---|---|
| `label` | `@UI.label("...")` |
| `help_text` | The doc comment (`/** ... */`) |
| `required: true` | A property without `?` |
| `constraints` | `@minLength`, `@maxLength`, or an enum type |
| `json_path` | The property name in `snake_case` (`applicantOrganizationName` becomes `applicant_organization_name`) |
| A repeating section's `min_items` / `max_items` | `@minItems` / `@maxItems` on an array |

`Questions.Types.StateCode` and `CountryCode` are the Grants.gov code lists, generated from its UniversalCodes XSD. They're types, not questions, so this step can still use them.

`@GrantsGov.form` is the identity the API registers the form under in step 6. Its `shortFormName` is different from the real Key Contacts form's, so the two don't collide.

### 2.2 Add the layout

Create `layout.tsp`:

```bash
touch specs/forms/key-contacts-tutorial/layout.tsp
```

Then paste this in:

```tsp
import "simpler-forms";

import "./form.tsp";

using SimplerForms;

namespace Forms.KeyContactsTutorial;

// Every top-level entry of a layout is a section, so the applicant's name gets one of its own.
@UI.layout(KeyContactsTutorial)
model KeyContactsTutorialLayout {
  @UI.label("Applicant Information")
  applicant: {
    applicantOrganizationName: KeyContactsTutorial.applicantOrganizationName;
  };

  /** You may enter up to four (4) key contacts. At least one (1) contact person is required. */
  @UI.label("Key Contacts")
  @UI.field(KeyContactsTutorial.keyContacts)
  keyContacts: {};
}
```

The form model says what data the form collects. The layout says how it's presented: each top-level entry is a section, and `@UI.field` lays out a field's contents inside a section. This layout keeps the form's own field order.

### 2.3 Wire it in

Create `index.tsp`:

```bash
touch specs/forms/key-contacts-tutorial/index.tsp
```

Then paste this in:

```tsp
// The data, and its presentation.
import "./form.tsp";
import "./layout.tsp";
```

Import it in `specs/main.tsp`:

```tsp
import "./forms/key-contacts-tutorial/index.tsp";
```

Point the plan at the compiled form by adding `spec_id` to `key-contacts-tutorial.json`:

```json
  "category": "Key Personnel & Contact Forms",
  "spec_id": "key-contacts-tutorial",
```

### Check

```bash
npm run compile
npx vitest run parity -t key-contacts-tutorial
```

The compile writes `dist/canonical/forms/key-contacts-tutorial/` (`schema.json`, `ui.json`, `index.json` and `manifest.json`). It reports 3 warnings, which come from the Key Person forms. The implementation checks now run, and pass:

```text
✓ Implementation checks > plan vs JSON schema > JSON schema has no missing fields
✓ Implementation checks > plan vs JSON schema > JSON schema has no extra fields
✓ Implementation checks > plan vs JSON schema > JSON schema matches field occurrences
✓ Implementation checks > plan vs JSON schema > JSON schema matches field constraints
✓ Implementation checks > plan vs UI schema > UI schema has no missing fields
✓ Implementation checks > plan vs UI schema > UI schema has no extra fields
✓ Implementation checks > plan vs UI schema > UI schema matches field order
✓ Implementation checks > plan vs UI schema > UI schema matches field labels
✓ Implementation checks > plan vs UI schema > UI schema matches help text
      Tests  26 passed
```

### See it in the form library

- **Form column:** each cell is now compared, and matches.
- **Form preview tab:** shows the form rendered with JSON Forms, as the apply page will draw it. Fill it in and open the **Data** tab to see the JSON it produces.

> **If the compile fails:** see [Troubleshooting](#troubleshooting). The two errors you're most likely to hit are a model name another form already uses, and a layout section that isn't a group.

---

## Step 3: Map the form to its XSD

**Goal:** XML transform rules that write each answer to the right XSD element, so the XML checks pass.

The mapping lives on a TypeSpec model of the XSD, the **mapping target**. Each element names the form field it's filled from with `@Mapping.from`. The emitter reads those links and writes `xml-transform.json`, the rules the API uses to build a submission's XML.

### 3.1 Add the XSD model

Create `xsd.tsp`:

```bash
touch specs/forms/key-contacts-tutorial/xsd.tsp
```

Then paste this in:

<details>
<summary><code>xsd.tsp</code></summary>

```tsp
import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";

import "#mapping/targets.tsp";

import "./form.tsp";

using TypeSpec.Xml;
using SimplerForms;

/** Key_Contacts_2_0-V2.0.xsd, mapped from the tutorial form. */
namespace XSD.KeyContactsTutorial20;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Form = Forms.KeyContactsTutorial.KeyContactsTutorial;
alias Contact = Forms.KeyContactsTutorial.TutorialKeyContact;
alias Name = Forms.KeyContactsTutorial.TutorialContactName;
alias Address = Forms.KeyContactsTutorial.TutorialContactAddress;

@nsDeclarations
enum Namespaces {
  Key_Contacts_2_0: "http://apply.grants.gov/forms/Key_Contacts_2_0-V2.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  codes: "http://apply.grants.gov/system/UniversalCodes-V2.0",
}

@name("Key_Contacts_2_0")
@ns(Namespaces.Key_Contacts_2_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/Key_Contacts_2_0-V2.0.xsd")
@Mapping.from(grantsGovXml, Form)
model Root {
  @Mapping.from(grantsGovXml, Form.applicantOrganizationName)
  @name("ApplicantOrganizationName")
  applicantOrganizationName: string;

  @Mapping.from(grantsGovXml, Form.keyContacts)
  @name("RoleOnProject")
  @maxItems(4)
  roleOnProject: RoleOnProject[];

  @attribute @name("FormVersion") formVersion: "2.0";
}

@ns(Namespaces.Key_Contacts_2_0)
model RoleOnProject {
  @Mapping.from(grantsGovXml, Contact.projectRole)
  @name("ContactProjectRole")
  contactProjectRole: string;

  @Mapping.from(grantsGovXml, Contact.name)
  @name("ContactName")
  contactName: HumanNameDataType;

  @Mapping.from(grantsGovXml, Contact.title)
  @name("ContactTitle")
  contactTitle?: string;

  @Mapping.from(grantsGovXml, Contact.organizationalAffiliation)
  @name("ContactOrganizationalAffiliation")
  contactOrganizationalAffiliation?: string;

  @Mapping.from(grantsGovXml, Contact.address)
  @name("ContactAddress")
  contactAddress: AddressDataTypeV3;

  @Mapping.from(grantsGovXml, Contact.phone)
  @name("ContactPhone")
  contactPhone: string;

  @Mapping.from(grantsGovXml, Contact.fax)
  @name("ContactFax")
  contactFax?: string;

  @Mapping.from(grantsGovXml, Contact.email)
  @name("ContactEmail")
  contactEmail: string;
}

// The tutorial form declares its own name and address, so it can't reuse the shared models in
// specs/xsd/global-library.tsp: those are mapped from the question bank's PersonName and Address.

/** `globLib:HumanNameDataType` */
@ns(Namespaces.globLib)
model HumanNameDataType {
  @Mapping.from(grantsGovXml, Name.prefix)
  @name("PrefixName")
  prefixName?: string;

  @Mapping.from(grantsGovXml, Name.firstName)
  @name("FirstName")
  firstName: string;

  @Mapping.from(grantsGovXml, Name.middleName)
  @name("MiddleName")
  middleName?: string;

  @Mapping.from(grantsGovXml, Name.lastName)
  @name("LastName")
  lastName: string;

  @Mapping.from(grantsGovXml, Name.suffix)
  @name("SuffixName")
  suffixName?: string;
}

/** `globLib:AddressDataTypeV3`. State and Province are an `xs:choice`. */
@ns(Namespaces.globLib)
model AddressDataTypeV3 {
  @Mapping.from(grantsGovXml, Address.street1)
  @name("Street1")
  street1: string;

  @Mapping.from(grantsGovXml, Address.street2)
  @name("Street2")
  street2?: string;

  @Mapping.from(grantsGovXml, Address.city)
  @name("City")
  city: string;

  @Mapping.from(grantsGovXml, Address.county)
  @name("County")
  county?: string;

  @Mapping.from(grantsGovXml, Address.state)
  @name("State")
  state?: string;

  @Mapping.from(grantsGovXml, Address.province)
  @name("Province")
  province?: string;

  @Mapping.from(grantsGovXml, Address.zipCode)
  @name("ZipPostalCode")
  zipPostalCode?: string;

  @Mapping.from(grantsGovXml, Address.country)
  @name("Country")
  country: string;
}
```

</details>

The models are in XSD order. Note that Zip / Postal Code comes before Country, the reverse of the DAT. That's fine: the form and the plan follow the DAT, and the XML follows the XSD.

The shared XSD models in `specs/xsd/global-library.tsp` (`HumanNameDataType`, `AddressDataTypeV3`) can't be used here. They're mapped once, from the question bank's `PersonName` and `Address`, and this form declares its own name and address. So the tutorial models those two types itself. In step 5 you'll see this go away.

### 3.2 Wire it in

Add the XSD model to `index.tsp`:

```tsp
// The data, its presentation, and its XML mapping.
import "./form.tsp";
import "./layout.tsp";
import "./xsd.tsp";
```

### Check

```bash
npm run compile
npx vitest run parity -t key-contacts-tutorial
npx vitest run parity/xsdModels.test.ts
```

The compile now also writes `xml-transform.json`, and the XML checks run and pass:

```text
✓ XML checks > XML mapping vs JSON schema > XML mapping has no missing fields
✓ XML checks > XML mapping vs JSON schema > XML mapping has no extra fields
✓ XML checks > XML mapping vs XSD > XML mapping has no missing fields
✓ XML checks > XML mapping vs XSD > XML mapping has no extra fields
✓ XML checks > XML mapping vs XSD > XML mapping matches field order
✓ XML checks > JSON schema vs XSD > JSON schema matches field occurrences
✓ XML checks > JSON schema vs XSD > JSON schema matches field constraints
      Tests  33 passed
```

`xsdModels.test.ts` checks your XSD model against the real XSD: element names, order, requiredness, occurrences and namespaces.

This is the **baseline** for the next step: every check passes, and the only recorded differences are the two upstream labels.

---

## Step 4: Break a check, record it, then let the record go stale

**Goal:** see what the checks catch, how a recorded difference looks in the form library, and why a record can't outlive the difference it describes.

### 4.1 Change a label and help text

In `form.tsp`, change First Name in `TutorialContactName`:

```tsp
  /** Enter the contact's given name. */
  @UI.label("Given Name")
  @minLength(1)
  @maxLength(35)
  firstName: string;
```

Run the checks:

```bash
npm run compile
npx vitest run parity -t key-contacts-tutorial
```

Three checks fail:

```text
 FAIL  parity/comparison.test.ts > key-contacts-tutorial > shows no unrecorded differences
 FAIL  ... > Implementation checks > plan vs UI schema > UI schema matches field labels
  label differs: key_contacts[].name.first_name -- plan "First Name", source "Given Name"
 FAIL  ... > Implementation checks > plan vs UI schema > UI schema matches help text
  help differs: key_contacts[].name.first_name -- plan "Enter the First Name. This field is required.", source "Enter the contact's given name."
      Tests  3 failed | 30 passed
```

The form no longer does what the plan says, and the comparison sheet flags it too. In the form library, reload the page: First Name's **Form** cells for Label and Help are now **!** (Unrecorded difference).

### 4.2 Record the difference

When a failure is a mistake, fix whichever side is wrong. When it's a deliberate choice, record it. Replace `parity/diffs/key-contacts-tutorial.ts` with:

<details>
<summary><code>key-contacts-tutorial.ts</code> with the step 4 record</summary>

```ts
import type { FormDiff, Pinned, Recorded } from "../harness/model.ts";

/** The DAT stars State and Zip / Postal Code, but its Required column and the XSD make them optional. */
const conditionalStar = (label: string): Pinned => ({
  plan: label,
  source: `* ${label}`,
  category: "upstream",
  reason:
    "The DAT stars State and Zip / Postal Code but marks them not required, and the XSD makes them optional. Its help text requires them only when Country is the United States, so the plan treats them as conditional.",
});

/** Tutorial step 4: the form renames First Name, which the plan still words as the DAT does. */
const GIVEN_NAME: Recorded = {
  category: "intentional",
  reason:
    "Tutorial step 4: the form asks for a given name, which reads more naturally to applicants whose family name comes first.",
};

export const DIFF: FormDiff = {
  slug: "key-contacts-tutorial",
  dat: {
    differingLabels: {
      "7-14": conditionalStar("State"),
      "7-17": conditionalStar("Zip / Postal Code"),
    },
  },
  uiSchema: {
    differingLabels: {
      "key_contacts[].name.first_name": { ...GIVEN_NAME, plan: "First Name", source: "Given Name" },
    },
    differingHelp: {
      "key_contacts[].name.first_name": {
        ...GIVEN_NAME,
        plan: "Enter the First Name. This field is required.",
        source: "Enter the contact's given name.",
      },
    },
  },
};
```

</details>

The record goes in `uiSchema`, the comparison that failed, keyed by `json_path`. Every check passes again. In the form library, the two cells are now **I** (Intentional) and show your reason.

### 4.3 Change it back

Revert First Name in `form.tsp` to its step 3 version (`"First Name"`, `Enter the First Name. This field is required.`), and run the checks again:

```text
 FAIL  parity/forms.test.ts > key-contacts-tutorial > Suite checks > recorded differences still exist
AssertionError: Entries in parity/diffs/ that no longer match a difference:
  stale entry: key_contacts[].name.first_name -- differingLabels records a difference that no longer exists
  stale entry: key_contacts[].name.first_name -- differingHelp records a difference that no longer exists
```

The record is now **stale**. It describes a difference that doesn't exist anymore, so the suite fails until you delete it. This keeps `parity/diffs/` an accurate list of how the form really differs.

### 4.4 Back to baseline

Restore `parity/diffs/key-contacts-tutorial.ts` to its step 1 version (the two upstream labels only). Every check passes again.

---

## Step 5: Use the question bank's contact questions

**Goal:** replace the hand-written contact fields with the question bank's `Person`, and handle the trade-off that creates.

Most forms that ask for a person use `Questions.People.Person`, so the name, address, phone and email are worded and validated the same way on every form. Using it here means this form reads the same as Key Contacts and EPA Key Contacts. But the question bank's wording isn't the DAT's.

### 5.1 Swap in `Person`

In `form.tsp`, import the person questions instead of the code lists, and replace `TutorialKeyContact`, `TutorialContactName` and `TutorialContactAddress` with this single model:

<details>
<summary><code>form.tsp</code> after step 5</summary>

```tsp
import "form-library-xml";
import "simpler-forms";

import "#forms/index.tsp";
import "#questions/person/index.tsp";

using SimplerForms;

namespace Forms.KeyContactsTutorial;

/** KEY CONTACTS, rebuilt for the form library tutorial. */
@Meta.form(#{ id: "key-contacts-tutorial", formName: "KEY CONTACTS (TUTORIAL)" })
@GrantsGov.form(#{
  legacyFormId: 683,
  shortFormName: "Key_Contacts_Tutorial",
  formVersion: "2.0",
  agencyCode: "SGG",
  ombNumber: "4040-0010",
})
model KeyContactsTutorial {
  /** Enter the legal name of the applicant that will undertake the assistance activity. This field is required. */
  @UI.label("Applicant Organization Name")
  @minLength(1)
  @maxLength(60)
  applicantOrganizationName: string;

  @UI.label("Key Contacts")
  @minItems(1)
  @maxItems(4)
  keyContacts: TutorialKeyContact[];
}

// Person makes email optional; Key Contacts requires it. Only a question can say so.
/** One key contact: a project role and an affiliation around the question bank's `Person`. */
@Meta.question(#{ id: "person/tutorial-key-contact" })
@Meta.tag(Catalogue.Tag.person, Catalogue.Tag.role)
@Validation.requiredPaths("email")
model TutorialKeyContact {
  /** Enter the project role of the contact person (e.g., project manager, fiscal contact). Additional contacts are optional. */
  @UI.label("Contact 1 Project Role")
  @minLength(1)
  @maxLength(45)
  projectRole: string;

  ...Questions.People.Person;

  /** Enter the Organizational Affiliation of the person to contact on matters related to this application. */
  @UI.label("Organizational Affiliation")
  @minLength(1)
  @maxLength(60)
  organizationalAffiliation?: string;
}
```

</details>

`...Questions.People.Person` spreads in the name, title, address, phone, fax and email.

**`TutorialKeyContact` is now a question** (`@Meta.question`) so it can make `email` required. `Person` declares it optional, and Key Contacts requires it. This is the pattern for overriding whether a nested field is required: declare the containing model as a question and add `@Validation.requiredPaths` with the field's path. The real Key Contacts form does the same in `specs/forms/key-contacts/key-contact.tsp`.

### 5.2 Put Organizational Affiliation back after Title

The spread puts Organizational Affiliation last, after Email, but the plan follows the DAT, which lists it straight after Title. The layout can fix the order without changing the data: the entries it lists come first, in the order it lists them, and the rest keep their declared order.

Replace `layout.tsp` with:

```tsp
import "simpler-forms";

import "./form.tsp";

using SimplerForms;

namespace Forms.KeyContactsTutorial;

// Every top-level entry of a layout is a section, so the applicant's name gets one of its own.
@UI.layout(KeyContactsTutorial)
model KeyContactsTutorialLayout {
  @UI.label("Applicant Information")
  applicant: {
    applicantOrganizationName: KeyContactsTutorial.applicantOrganizationName;
  };

  /** You may enter up to four (4) key contacts. At least one (1) contact person is required. */
  @UI.label("Key Contacts")
  @UI.field(KeyContactsTutorial.keyContacts)
  keyContacts: {
    // Person's fields come between the project role and the affiliation; the DAT puts the
    // affiliation straight after the title. Entries listed here come first, in this order.
    projectRole: TutorialKeyContact.projectRole;
    name: TutorialKeyContact.name;
    title: TutorialKeyContact.title;
    organizationalAffiliation: TutorialKeyContact.organizationalAffiliation;
  };
}
```

If you skip this, step 5.4 also fails `UI schema matches field order`, with `out of order: key_contacts[].organizational_affiliation -- plan position 8, source position 19`.

### 5.3 Reuse the shared XSD models

Because the name and address are now the question bank's, the shared `globLib` models already know how to map them. In `xsd.tsp`, delete the tutorial's own `HumanNameDataType` and `AddressDataTypeV3` and use `XSD.GlobLib`'s:

<details>
<summary><code>xsd.tsp</code> after step 5</summary>

```tsp
import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";

import "#mapping/targets.tsp";
import "#xsd/global-library.tsp";

import "./form.tsp";

using TypeSpec.Xml;
using SimplerForms;

/** Key_Contacts_2_0-V2.0.xsd, mapped from the tutorial form. */
namespace XSD.KeyContactsTutorial20;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Form = Forms.KeyContactsTutorial.KeyContactsTutorial;
alias Contact = Forms.KeyContactsTutorial.TutorialKeyContact;
alias GlobLib = XSD.GlobLib;

@nsDeclarations
enum Namespaces {
  Key_Contacts_2_0: "http://apply.grants.gov/forms/Key_Contacts_2_0-V2.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  codes: "http://apply.grants.gov/system/UniversalCodes-V2.0",
}

@name("Key_Contacts_2_0")
@ns(Namespaces.Key_Contacts_2_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/Key_Contacts_2_0-V2.0.xsd")
@Mapping.from(grantsGovXml, Form)
model Root {
  @Mapping.from(grantsGovXml, Form.applicantOrganizationName)
  @name("ApplicantOrganizationName")
  applicantOrganizationName: string;

  @Mapping.from(grantsGovXml, Form.keyContacts)
  @name("RoleOnProject")
  @maxItems(4)
  roleOnProject: RoleOnProject[];

  @attribute @name("FormVersion") formVersion: "2.0";
}

@ns(Namespaces.Key_Contacts_2_0)
model RoleOnProject {
  @Mapping.from(grantsGovXml, Contact.projectRole)
  @name("ContactProjectRole")
  contactProjectRole: string;

  @Mapping.from(grantsGovXml, Contact.name)
  @name("ContactName")
  contactName: GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, Contact.title)
  @name("ContactTitle")
  contactTitle?: string;

  @Mapping.from(grantsGovXml, Contact.organizationalAffiliation)
  @name("ContactOrganizationalAffiliation")
  contactOrganizationalAffiliation?: string;

  @Mapping.from(grantsGovXml, Contact.address)
  @name("ContactAddress")
  contactAddress: GlobLib.AddressDataTypeV3;

  @Mapping.from(grantsGovXml, Contact.phone)
  @name("ContactPhone")
  contactPhone: string;

  @Mapping.from(grantsGovXml, Contact.fax)
  @name("ContactFax")
  contactFax?: string;

  @Mapping.from(grantsGovXml, Contact.email)
  @name("ContactEmail")
  contactEmail: string;
}
```

</details>

This is one of the question bank's payoffs: the mapping for a person's name and address is written once, for every form.

### 5.4 See what breaks

```bash
npm run compile
npx vitest run parity -t key-contacts-tutorial
```

```text
 FAIL  parity/comparison.test.ts > key-contacts-tutorial > shows no unrecorded differences
 FAIL  ... > plan vs JSON schema > JSON schema matches field constraints
  format differs: key_contacts[].email -- plan none, source "email"
 FAIL  ... > plan vs UI schema > UI schema matches field labels
  label differs: key_contacts[].address.county -- plan "County", source "County/Parish"
  label differs: key_contacts[].phone -- plan "Telephone Number", source "Phone Number"
  label differs: key_contacts[].fax -- plan "Fax", source "Fax Number"
 FAIL  ... > plan vs UI schema > UI schema matches help text
  help differs: key_contacts[].name.prefix -- plan "Select the Prefix from the provided list or enter a new Prefix not provided on the list.", source "Enter the prefix."
  help differs: key_contacts[].name.first_name -- plan "Enter the First Name. This field is required.", source "Enter the first name."
  ... (16 in all)
```

The XML checks still pass. Only the wording changed, and the question bank adds an email format.

### 5.5 Choose: match the DAT, or match the other forms

You can't have both, so pick one:

- **A. Keep the plan as it is, and override the wording in this form.** A layout entry can relabel a field for this form only:

  ```tsp
      /** Enter the daytime Telephone Number. This field is required. */
      @UI.label("Telephone Number")
      phone: TutorialKeyContact.phone;
  ```

  The form keeps matching the DAT, but its contact fields now read differently from every other form that asks for a person. Do that for every field `Person` supplies and you've rebuilt step 2's form, with extra steps.
- **B. Change the plan to the question bank's wording, and record the differences from the DAT as intentional.** The form reads like every other form that uses `Person`. The plan now says, on purpose, that Simpler Grants words these fields differently from Grants.gov. **This is what the real forms do, so do this.**

### 5.6 Update the plan

Replace `key-contacts-tutorial.json` with this version, which uses the question bank's wording for every field `Person` supplies:

<details>
<summary><code>key-contacts-tutorial.json</code> after step 5</summary>

```json
{
  "title": "Key Contacts (Tutorial)",
  "slug": "key-contacts-tutorial",
  "omb_number": "4040-0010",
  "expiration_date": "08/31/2029",
  "fid_url": "https://www.grants.gov/forms/form-items-description/fid/683",
  "pdf_url": "https://apply07.grants.gov/apply/forms/readonly/Key_Contacts_2_0-V2.0_F683.pdf",
  "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/Key_Contacts_2_0-V2.0.xsd",
  "dat_url": "https://apply07.grants.gov/apply/forms/sample/Key_Contacts_2_0-V2.0_F683.xls",
  "status": "in_progress",
  "category": "Key Personnel & Contact Forms",
  "spec_id": "key-contacts-tutorial",
  "description": "A copy of Key Contacts for the form library tutorial. Its labels and help text follow the Grants.gov DAT word for word.",
  "children": [
    {
      "kind": "section",
      "label": "Applicant Information",
      "widget": "FieldsetWidget",
      "children": [
        {
          "kind": "field",
          "label": "Applicant Organization Name",
          "dat_field": "5",
          "required": true,
          "type": "Text input",
          "widget": "TextWidget",
          "help_text": "Enter the legal name of the applicant that will undertake the assistance activity. This field is required.",
          "constraints": "minLength 1, maxLength 60",
          "json_path": "applicant_organization_name",
          "xml_path": "Key_Contacts_2_0:ApplicantOrganizationName"
        }
      ]
    },
    {
      "kind": "section",
      "label": "Key Contacts",
      "min_items": 1,
      "max_items": 4,
      "json_path": "key_contacts",
      "xml_path": "Key_Contacts_2_0:RoleOnProject",
      "widget": "FieldListWidget",
      "children": [
        {
          "kind": "field",
          "label": "Contact 1 Project Role",
          "dat_field": "7-01",
          "required": true,
          "type": "Text input",
          "widget": "TextWidget",
          "help_text": "Enter the project role of the contact person (e.g., project manager, fiscal contact). Additional contacts are optional.",
          "constraints": "minLength 1, maxLength 45",
          "json_path": "key_contacts[].project_role",
          "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactProjectRole"
        },
        {
          "kind": "section",
          "label": "Name",
          "json_path": "key_contacts[].name",
          "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactName",
          "widget": "FieldsetWidget",
          "children": [
            {
              "kind": "field",
              "label": "Prefix",
              "dat_field": "7-03",
              "required": false,
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Enter the prefix.",
              "constraints": "minLength 1, maxLength 10",
              "json_path": "key_contacts[].name.prefix",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactName/globLib:PrefixName"
            },
            {
              "kind": "field",
              "label": "First Name",
              "dat_field": "7-04",
              "required": true,
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Enter the first name.",
              "constraints": "minLength 1, maxLength 35",
              "json_path": "key_contacts[].name.first_name",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactName/globLib:FirstName"
            },
            {
              "kind": "field",
              "label": "Middle Name",
              "dat_field": "7-05",
              "required": false,
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Enter the middle name.",
              "constraints": "minLength 1, maxLength 25",
              "json_path": "key_contacts[].name.middle_name",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactName/globLib:MiddleName"
            },
            {
              "kind": "field",
              "label": "Last Name",
              "dat_field": "7-06",
              "required": true,
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Enter the last name.",
              "constraints": "minLength 1, maxLength 60",
              "json_path": "key_contacts[].name.last_name",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactName/globLib:LastName"
            },
            {
              "kind": "field",
              "label": "Suffix",
              "dat_field": "7-07",
              "required": false,
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Enter the suffix.",
              "constraints": "minLength 1, maxLength 10",
              "json_path": "key_contacts[].name.suffix",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactName/globLib:SuffixName"
            }
          ]
        },
        {
          "kind": "field",
          "label": "Title",
          "dat_field": "7-08",
          "required": false,
          "type": "Text input",
          "widget": "TextWidget",
          "help_text": "Enter the position title.",
          "constraints": "minLength 1, maxLength 45",
          "json_path": "key_contacts[].title",
          "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactTitle"
        },
        {
          "kind": "field",
          "label": "Organizational Affiliation",
          "dat_field": "7-09",
          "required": false,
          "type": "Text input",
          "widget": "TextWidget",
          "help_text": "Enter the Organizational Affiliation of the person to contact on matters related to this application.",
          "constraints": "minLength 1, maxLength 60",
          "json_path": "key_contacts[].organizational_affiliation",
          "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactOrganizationalAffiliation"
        },
        {
          "kind": "section",
          "label": "Address",
          "json_path": "key_contacts[].address",
          "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactAddress",
          "widget": "FieldsetWidget",
          "children": [
            {
              "kind": "field",
              "label": "Street1",
              "dat_field": "7-10",
              "required": true,
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Enter the first line of the street address.",
              "constraints": "minLength 1, maxLength 55",
              "json_path": "key_contacts[].address.street1",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactAddress/globLib:Street1"
            },
            {
              "kind": "field",
              "label": "Street2",
              "dat_field": "7-11",
              "required": false,
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Enter the second line of the street address.",
              "constraints": "minLength 1, maxLength 55",
              "json_path": "key_contacts[].address.street2",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactAddress/globLib:Street2"
            },
            {
              "kind": "field",
              "label": "City",
              "dat_field": "7-12",
              "required": true,
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Enter the city.",
              "constraints": "minLength 1, maxLength 35",
              "json_path": "key_contacts[].address.city",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactAddress/globLib:City"
            },
            {
              "kind": "field",
              "label": "County/Parish",
              "dat_field": "7-13",
              "required": false,
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Enter the county or parish.",
              "constraints": "minLength 1, maxLength 30",
              "json_path": "key_contacts[].address.county",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactAddress/globLib:County"
            },
            {
              "kind": "field",
              "label": "State",
              "dat_field": "7-14",
              "required": "Conditional (when Country = 'USA')",
              "type": "Dropdown",
              "widget": "SelectWidget",
              "help_text": "Select the state. This field is required if the country is the United States.",
              "constraints": "StateCodeDataTypeV3",
              "json_path": "key_contacts[].address.state",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactAddress/globLib:State"
            },
            {
              "kind": "field",
              "label": "Province",
              "dat_field": "7-15",
              "required": false,
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Enter the province.",
              "constraints": "minLength 1, maxLength 30",
              "json_path": "key_contacts[].address.province",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactAddress/globLib:Province"
            },
            {
              "kind": "field",
              "label": "Country",
              "dat_field": "7-16",
              "required": true,
              "type": "Dropdown",
              "widget": "SelectWidget",
              "help_text": "Select the country.",
              "constraints": "CountryCodeDataTypeV3",
              "json_path": "key_contacts[].address.country",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactAddress/globLib:Country"
            },
            {
              "kind": "field",
              "label": "Zip / Postal Code",
              "dat_field": "7-17",
              "required": "Conditional (when Country = 'USA')",
              "type": "Text input",
              "widget": "TextWidget",
              "help_text": "Enter the zip / postal code. This field is required if the country is the United States.",
              "constraints": "minLength 1, maxLength 30",
              "json_path": "key_contacts[].address.zip_code",
              "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactAddress/globLib:ZipPostalCode"
            }
          ]
        },
        {
          "kind": "field",
          "label": "Phone Number",
          "dat_field": "7-18",
          "required": true,
          "type": "Text input",
          "widget": "TextWidget",
          "help_text": "Enter the phone number.",
          "constraints": "minLength 1, maxLength 25",
          "json_path": "key_contacts[].phone",
          "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactPhone"
        },
        {
          "kind": "field",
          "label": "Fax Number",
          "dat_field": "7-19",
          "required": false,
          "type": "Text input",
          "widget": "TextWidget",
          "help_text": "Enter the fax number.",
          "constraints": "minLength 1, maxLength 25",
          "json_path": "key_contacts[].fax",
          "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactFax"
        },
        {
          "kind": "field",
          "label": "Email",
          "dat_field": "7-20",
          "required": true,
          "type": "Text input",
          "widget": "TextWidget",
          "help_text": "Enter the email address.",
          "constraints": "minLength 1, maxLength 60, format email",
          "json_path": "key_contacts[].email",
          "xml_path": "Key_Contacts_2_0:RoleOnProject/Key_Contacts_2_0:ContactEmail"
        }
      ]
    }
  ]
}
```

</details>

These are the fields that change:

| Field (`json_path`) | Plan key | New value |
|---|---|---|
| `key_contacts[].name.prefix` | `help_text` | Enter the prefix. |
| `key_contacts[].name.first_name` | `help_text` | Enter the first name. |
| `key_contacts[].name.middle_name` | `help_text` | Enter the middle name. |
| `key_contacts[].name.last_name` | `help_text` | Enter the last name. |
| `key_contacts[].name.suffix` | `help_text` | Enter the suffix. |
| `key_contacts[].address.street1` | `help_text` | Enter the first line of the street address. |
| `key_contacts[].address.street2` | `help_text` | Enter the second line of the street address. |
| `key_contacts[].address.city` | `help_text` | Enter the city. |
| `key_contacts[].address.county` | `label` | County/Parish |
| `key_contacts[].address.county` | `help_text` | Enter the county or parish. |
| `key_contacts[].address.state` | `help_text` | Select the state. This field is required if the country is the United States. |
| `key_contacts[].address.province` | `help_text` | Enter the province. |
| `key_contacts[].address.country` | `help_text` | Select the country. |
| `key_contacts[].address.zip_code` | `help_text` | Enter the zip / postal code. This field is required if the country is the United States. |
| `key_contacts[].phone` | `label` | Phone Number |
| `key_contacts[].phone` | `help_text` | Enter the phone number. |
| `key_contacts[].fax` | `label` | Fax Number |
| `key_contacts[].fax` | `help_text` | Enter the fax number. |
| `key_contacts[].email` | `help_text` | Enter the email address. |
| `key_contacts[].email` | `constraints` | minLength 1, maxLength 60, format email |

The implementation checks pass. The difference has moved to where it belongs, the requirements checks: the plan now differs from the DAT.

```text
 FAIL  parity/comparison.test.ts > key-contacts-tutorial > shows no unrecorded differences
 FAIL  ... > Requirements checks > plan vs DAT > plan matches field labels
  label differs: 7-13 -- plan "County/Parish", source "County"
  label differs: 7-18 -- plan "* Phone Number", source "* Telephone Number"
  label differs: 7-19 -- plan "Fax Number", source "Fax"
 FAIL  ... > Requirements checks > plan vs DAT > plan matches help text
  ... (16 in all)
```

### 5.7 Record the differences as intentional

You could pin each field's label and help one by one, as `parity/diffs/key-contacts.ts` does. When every difference has the same cause, `wording` accepts them all at once, with one reason. Add it to `parity/diffs/key-contacts-tutorial.ts`:

```ts
import type { FormDiff, Pinned } from "../harness/model.ts";
import { BANK_WORDING } from "./common.ts";

/** The DAT stars State and Zip / Postal Code, but its Required column and the XSD make them optional. */
const conditionalStar = (label: string): Pinned => ({
  plan: label,
  source: `* ${label}`,
  category: "upstream",
  reason:
    "The DAT stars State and Zip / Postal Code but marks them not required, and the XSD makes them optional. Its help text requires them only when Country is the United States, so the plan treats them as conditional.",
});

export const DIFF: FormDiff = {
  slug: "key-contacts-tutorial",
  // Step 5: the contact fields come from the question bank's Person, so the plan uses its wording.
  wording: BANK_WORDING,
  dat: {
    differingLabels: {
      "7-14": conditionalStar("State"),
      "7-17": conditionalStar("Zip / Postal Code"),
    },
  },
};
```

`BANK_WORDING` is shared by every form that takes its wording from the question bank (see `parity/diffs/common.ts`). Each difference is still compared and shown, with both values side by side.

### Check

```bash
npm run compile
npm run test:parity
(cd site && npm run check && npm test && npm run build)
```

```text
 Test Files  11 passed (11)
      Tests  332 passed | 12 todo (344)
```

In the form library, the 19 differing labels and help texts show as **I** (Intentional) in the DAT column, each with the question bank reason. The upstream labels from step 1 are still **U**.

---

## Step 6: Install the form into the API

**Goal:** a form the API serves and the frontend renders with JSON Forms.

### 6.1 Mark the form for sync

A form reaches the API only when it opts in. In `form.tsp`, import the SGG emitter and add `@Sgg.sync` to the form model:

```tsp
import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";

// ...

@Meta.form(#{ id: "key-contacts-tutorial", formName: "KEY CONTACTS (TUTORIAL)" })
@Sgg.sync
@GrantsGov.form(#{
  // ...
```

`@Sgg.sync` needs `@GrantsGov.form`, which you added in step 2: it's the identity the API registers the form under. `@Sgg.sync(#{ xml: false })` installs a form without its XML rules, while they can't produce a valid document yet.

### 6.2 Sync it into the API

```bash
npm run compile
npm run sync
npm run sync:check
```

```text
  skipped epa-key-contacts (no @Sgg.sync)
  skipped key-contacts (no @Sgg.sync)
  key_contacts_tutorial_generated/  form.json, json_schema.json, ui_schema.json, xml_transform.json, config.py, __init__.py  994c91fc-ce09-5806-a9e6-71ecf93a775f
  ...
all forms match the emitted artifacts
```

Sync writes `api/src/form_schema/forms/key_contacts_tutorial_generated/`. Its `form.json` sets `"form_renderer": "jsonforms"`, so the frontend draws it with JSON Forms. The form id is derived from the spec id, so it's the same every time you sync. `sync:check` is what CI runs: it fails if what's committed differs from what the specs emit.

### 6.3 Register it

Registering a form is a deliberate, hand-written step. In `api/src/form_schema/forms/__init__.py`, import the form and add it to `_ALL_FORMS`:

```python
from .key_contacts_tutorial_generated import FORM as KeyContactsTutorialGenerated_v1_0

_ALL_FORMS: list[Form] = [
    # ...
    ProjectPerformanceSiteLocation_v4_0,
    KeyContactsTutorialGenerated_v1_0,
]
```

Check that the API loads it. From `api/`, this doesn't need the database:

```bash
uv run pytest tests/src/form_schema/forms/test_loader.py tests/src/form_schema/forms/test_form_structure.py
```

### 6.4 See it in the API

Start the API, and seed the local database. The seed registers every form, and creates an opportunity for each one:

```bash
cd api
make init            # first time only
make start           # restart the API if it was already running, so it loads the new form
make db-seed-local
```

The seed logs a link for the tutorial form's opportunity:

```text
Created a competition for form 'Key_Contacts_Tutorial_Generated 2.0' - http://localhost:3000/opportunity/<opportunity_id>
```

Fetch the form:

```bash
curl -s -H "X-API-Key: local-dev-api-key" \
  http://localhost:8080/alpha/forms/994c91fc-ce09-5806-a9e6-71ecf93a775f
```

The response includes `"form_name": "KEY CONTACTS (TUTORIAL)"` and `"form_renderer": "jsonforms"`, and its `form_ui_schema` is the JSON Forms UI schema from `ui.json`.

### 6.5 See it in the frontend

```bash
cd frontend
npm run dev
```

1. Open `http://localhost:3000` and log in. The local mock login accepts any user name; `one_org_user` is a seeded user who belongs to an organization (see [local seed data](../../documentation/api/local-seed-data.md)).
2. Open the opportunity link the seed logged, and start an application.
3. Open **KEY CONTACTS (TUTORIAL)**. It renders with the SGG widgets, in the sections from your layout.
4. Fill in a contact and save. Leave Email empty and save again to see its validation warning.

---

## Clean up

The tutorial form shouldn't be committed. From the repository root, remove everything it added:

```bash
git restore forms/specs/main.tsp forms/parity/diffs/index.ts api/src/form_schema/forms/__init__.py
rm -r forms/specs/forms/key-contacts-tutorial \
  forms/site/src/content/forms/key-contacts-tutorial.json \
  forms/parity/diffs/key-contacts-tutorial.ts \
  api/src/form_schema/forms/key_contacts_tutorial_generated
(cd forms && npm run clean && npm run compile && npm run sync:check && npm run test:parity)
```

`npm run compile` adds to `dist/` but never removes a form from it, so `npm run clean` deletes `dist/` first. Otherwise sync still finds the tutorial's old artifacts, marked `@Sgg.sync`, and `sync:check` reports them as drift.

Sync never deletes an installed form, so if you skip removing `key_contacts_tutorial_generated/`, `sync:check` reminds you:

```text
drift: key_contacts_tutorial_generated/ is installed but its form no longer has @Sgg.sync -- delete the directory and its _ALL_FORMS entry, or restore the decorator
```

## Troubleshooting

**`block-not-emitted: KeyContact produced no schema under id "person/key-contact/schema.json"`**
Two models in different namespaces have the same name. Model names share one id space across all specs, so a model called `KeyContact` in your form collides with Key Contacts' question. Give your models distinct names, as the tutorial's `Tutorial*` models do.

**`layout-section-not-group: Top-level entries of ... are sections`**
Each top-level entry of a layout has to be a group. To place a whole field, such as a list, as a section, use `@UI.field(Form.field)` with an entry model (`keyContacts: {};`).

**`cardinality-model-not-emitted: Cardinality annotations on model ... would not be emitted`**
`@Validation.requiredPaths` only works on a question (`@Meta.question`) or a form (`@Meta.form`), since a plain model has no schema of its own to carry it.

**`mapping-from-unresolved: ... is filled from PersonName.firstName, which is not a field of ...`**
You've used a shared XSD model from `specs/xsd/global-library.tsp` for a field that isn't the question bank question it's mapped from. Either use the question bank's question, or model that XSD type for your form (step 3).

**A check reports `recorded as plan ..., source ...`**
A pinned record no longer matches. One of the values changed after you recorded it. Fix the change, or update the record's `plan` and `source`.

**`sync:check` reports drift for a form you deleted or renamed**
`dist/` still holds its old artifacts, since compiling never removes a form's output. Run `npm run clean && npm run compile`.

**The Form preview tab doesn't update**
Run `npm run compile` in `forms/`, then reload. The dev server reads the compiled artifacts in `dist/`, not the `.tsp` files.
