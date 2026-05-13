# Field Boundary Validation Utility

A reusable, metadata-driven Playwright + TypeScript framework for automatically validating form field boundary conditions across all application forms.

---

## What Was Created

```
frontend/tests/e2e/utils/field-validation/
├── README.md                          ← this file
├── index.ts                           ← barrel export (single import for consumers)
├── types/
│   └── field-config.ts                ← core TypeScript interfaces
├── utils/
│   ├── build-validation-config.ts     ← derive FieldConfig[] from existing field definitions
│   ├── test-data-generators.ts        ← generates boundary string/numeric values
│   ├── interaction-helpers.ts         ← fill, clear, scroll, blur helpers
│   ├── assertion-helpers.ts           ← soft-assertion wrappers
│   └── validation-reporter.ts         ← console + Playwright attachment reporter
├── validators/
│   ├── length-validator.ts            ← maxLength / minLength / exactLength
│   ├── numeric-validator.ts           ← min / max for number inputs
│   ├── required-validator.ts          ← required field empty-state check
│   └── pattern-validator.ts           ← regex pattern checks
├── validate-field-constraints.ts      ← main orchestrator (public API)
└── configs/
    └── sf424-validation-config.ts     ← SF-424 overrides config (example)
```

A sample test that uses the framework lives at:
```
frontend/tests/e2e/apply/forms/happy-path/specs/field-boundary-validation.spec.ts
```

---

## What It Does

The framework takes a **config-driven approach**: you describe your form fields in a plain TypeScript array, and the utility automatically runs boundary checks against the live Playwright page.

For each field in your config the orchestrator runs every applicable validator:

| Validator | What it checks |
|---|---|
| **Required** | Clears the field, blurs it, asserts the required error appears (inline error element or `validity.valueMissing`) |
| **Length** | Inputs a string one character over `maxLength`, at `maxLength`, one below `minLength`, at `minLength`, and exactly at `exactLength` — asserting truncation or inline error per `validationMode` |
| **Numeric** | Inputs `min - 1`, `min`, `max`, and `max + 1` — asserting errors appear for out-of-range and are absent in-range |
| **Pattern** | Inputs an obviously invalid value and checks `errorLocator` visibility or `validity.patternMismatch` |

All assertions use **`expect.soft()`** so a failure in one field never stops the rest from running. After all fields are processed a **summary report** is printed to the console and optionally attached to the Playwright test output as `field-validation-report.txt`.

### DOM auto-detection

When `autoDetectConstraints: true` is set on a field, the framework reads `maxlength`, `min`, and `max` HTML attributes from the live DOM at runtime. This keeps your config in sync with the UI automatically and is especially useful during active development.

---

## How to Use It Across Any Form

Each form already has a `*-field-definitions.ts` file in `frontend/tests/e2e/apply/fixtures/` that contains all the Playwright locators and UI labels. The `buildValidationConfig` utility turns that into a `FieldConfig[]` automatically — you only need to write a small overrides object for things the DOM cannot tell us.

**No duplication of locators or constraint values.** The locators come from the existing definitions. The constraint values (`maxLength`, `minLength`, `min`, `max`, `required`) are read from the live DOM at runtime via `autoDetectConstraints`.

### Step 1 — Create an overrides file for your form

```typescript
// tests/e2e/utils/field-validation/configs/my-form-validation-config.ts

import {
  buildValidationConfig,
  FieldConfigOverrides,
} from "tests/e2e/utils/field-validation/utils/build-validation-config";
import { fieldDefinitionsMyForm } from "tests/e2e/apply/fixtures/my-form-field-definitions";

/**
 * Only list fields that need something the DOM cannot communicate:
 *  - errorLocator   → the inline error element's CSS selector
 *  - validationMode → "inline-error" when exceeding max shows an error (not truncation)
 *  - type           → "tel" | "email" | "textarea" (FillFieldDefinition only has "text")
 *  - pattern        → explicit regex (e.g. monetary format)
 *  - skip: true     → exclude date pickers or hidden conditional fields
 *
 * Everything else is auto-detected from the DOM — no manual constraint values needed.
 */
const MY_FORM_OVERRIDES: FieldConfigOverrides = {
  // Date pickers (typed as "text" in field definitions but not boundary-testable)
  start_date: { skip: true },
  end_date:   { skip: true },

  // Conditional field (only rendered under certain conditions)
  conditional_text: { skip: true },

  // Required field with inline error
  first_name: { errorLocator: "#error-for-first_name" },

  // Email / phone type refinements
  email:        { type: "email", validationMode: "inline-error", errorLocator: "#error-for-email" },
  phone_number: { type: "tel",   errorLocator: "#error-for-phone_number" },
};

export const MY_FORM_VALIDATION_CONFIG = buildValidationConfig(
  fieldDefinitionsMyForm,
  MY_FORM_OVERRIDES,
);
```

Non-text field types (`dropdown`, `file`, `radiobutton`, `checkbox`, `combo-box-input`) are excluded automatically — no need to list them with `skip: true`.

### Step 2 — Write a test spec that calls `validateFieldConstraints`

```typescript
// tests/e2e/apply/forms/happy-path/specs/my-form-field-validation.spec.ts

import { test, expect, type Page, type BrowserContext, type TestInfo } from "@playwright/test";
import { authenticateE2eUser } from "tests/e2e/utils/authenticate-e2e-user-utils";
import { validateFieldConstraints } from "tests/e2e/utils/field-validation";
import { MY_FORM_VALIDATION_CONFIG } from "tests/e2e/utils/field-validation/configs/my-form-validation-config";

test("My Form field boundary validation", async (
  { page, context }: { page: Page; context: BrowserContext },
  testInfo: TestInfo,
) => {
  test.setTimeout(300_000);

  // 1. Navigate to the form (using whatever auth/navigation your form requires)
  await authenticateE2eUser({ page, context });
  await page.goto("/path/to/my-form");

  // 2. Run all boundary checks — returns a summary report
  const report = await validateFieldConstraints(page, MY_FORM_VALIDATION_CONFIG, testInfo);

  // 3. Assert no failures
  expect(report.failed).toBe(0);
});
```

### Step 3 — Run the test

```bash
# run just this spec
npx playwright test my-form-field-validation

# run with a specific project (e.g. Chrome only)
npx playwright test my-form-field-validation --project=Chrome

# run all field-validation specs
npx playwright test field-boundary-validation
```

---

## FieldConfig Reference

| Property | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | ✅ | Human-readable name used in reports |
| `locator` | `string` | ✅ | Playwright locator string (CSS, `[data-testid]`, aria label, etc.) |
| `type` | `"text" \| "number" \| "textarea" \| "email" \| "tel"` | ✅ | Input type — determines which validators run |
| `required` | `boolean` | | Runs the required-field validator when `true` |
| `maxLength` | `number` | | Maximum allowed character count for text/textarea fields |
| `minLength` | `number` | | Minimum allowed character count for text/textarea fields |
| `exactLength` | `number` | | Exact character count required (e.g. 9-digit EIN) |
| `min` | `number` | | Minimum allowed value for number inputs |
| `max` | `number` | | Maximum allowed value for number inputs |
| `pattern` | `RegExp` | | Regex the value must match |
| `errorLocator` | `string` | | CSS selector for the inline error element tied to this field |
| `validationMode` | `"truncate" \| "inline-error" \| "submit-error"` | | How the field surfaces validation feedback. Default: `"truncate"` |
| `autoDetectConstraints` | `boolean` | | Read `maxlength` / `min` / `max` from the DOM at runtime to supplement config values |

### `validationMode` explained

| Mode | Meaning |
|---|---|
| `truncate` | The browser enforces length via the `maxlength` HTML attribute. No error element is shown; the value is silently capped. The validator asserts the field value length ≤ `maxLength`. |
| `inline-error` | An error element appears next to the field after blur. The validator asserts `errorLocator` is visible for invalid input and hidden for valid input. |
| `submit-error` | Errors only surface on form submit. The current validators skip active error-visibility checks for this mode (reserved for future extension). |

---

## ValidationSummaryReport

`validateFieldConstraints` returns a `ValidationSummaryReport`:

```typescript
{
  totalChecks: number;    // total individual assertions run
  passed: number;         // assertions that passed
  failed: number;         // assertions that failed
  results: FieldValidationResult[];  // full detail for every check
}
```

Each `FieldValidationResult` contains:

```typescript
{
  fieldLabel: string;       // from FieldConfig.label
  validationType: string;   // e.g. "maxLength (truncate)", "required", "below-min (−1)"
  inputValue: string;       // the value that was typed into the field
  expectedBehavior: string; // what should have happened
  actualBehavior: string;   // what actually happened
  passed: boolean;
}
```

The report is printed to the console in a readable format and, when `testInfo` is passed, attached to the Playwright HTML report as `field-validation-report.txt` for CI visibility.

---

## How to Source Field Constraints

With `buildValidationConfig`, **you don't need to look up the API schema at all** for most fields. Set `autoDetectConstraints: true` (which the builder sets for every field by default) and the framework reads `maxlength`, `min`, `max`, `required`, and `pattern` directly from the live DOM at test runtime.

If you do need to audit constraints manually (e.g. to verify DOM attributes are correct), they are defined here:

| API `FieldInfo` property | Maps to `FieldConfig` property |
|---|---|
| `required` | `required` |
| `min_value` (string context) | `minLength` |
| `max_value` (string context) | `maxLength` |
| `min_value` (number context) | `min` |
| `max_value` (number context) | `max` |
| `data_type` | `type` |

With `buildValidationConfig`, `autoDetectConstraints: true` is set automatically for every field. This is always preferred over hardcoding values.

---

## Adding a New Form — Quick Checklist

1. [ ] Create `configs/<my-form>-validation-config.ts`
2. [ ] Import `buildValidationConfig` and the form's `fieldDefinitions*` object
3. [ ] Write a `MY_FORM_OVERRIDES` object — only list fields that need `errorLocator`, `validationMode`, `type`, `pattern`, or `skip`
4. [ ] Export `MY_FORM_VALIDATION_CONFIG = buildValidationConfig(fieldDefinitions, overrides)`
5. [ ] Create a spec file that calls `validateFieldConstraints(page, MY_FORM_VALIDATION_CONFIG, testInfo)`
6. [ ] Assert `expect(report.failed).toBe(0)`
7. [ ] Run locally with `npx playwright test <spec-name>`
