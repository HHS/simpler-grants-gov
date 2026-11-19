# JSON Forms renderer

Instead of the [SGG UI schema](../README.md#ui-schema), a form can use a [JSON Forms](https://jsonforms.io/docs/) UI schema. To opt in, the form's API response sets `form_renderer` to `"jsonforms"`. When `form_renderer` is `"sgg"` or missing, the form uses the SGG UI schema.

## Terminology

A field in a JSON Forms form can be rendered by two kinds of widget:

| Term                   | What it is                                                                                                                                        | Where it's used                                                                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SGG widget**         | One of the existing USWDS widgets in `widgets/`, patterned after RJSF widgets and registered in `widgetComponents`                                | Every field in an SGG form, and every field the SGG adapter can map in a JSON Forms form                                                                                                            |
| **JSON Forms control** | A component in `controls/` written with JSON Forms' API (a tester plus `withJsonFormsControlProps` or a similar wrapper) instead of an SGG widget | The apply form's sections (`FieldsetControl`) and lists (`FieldListControl`), and the form library's sections and collapsible list. See [Adding a JSON Forms control](#adding-a-json-forms-control) |

The **SGG adapter** (`AdaptedControl`, `AdaptedLayout`) is what lets JSON Forms render a control with an SGG widget.

In these READMEs, "renderer" means the form-level renderer: the SGG renderer, or the JSON Forms renderer in `JsonFormsFields`. JSON Forms' own API calls individual widgets "renderers" (e.g. the `renderers` and `extraRenderers` lists), but we call them widgets to keep the two apart.

## How it works

- **Layout and rules:** JSON Forms handles the layout and the rules that show, hide, enable or disable fields. Every field is still rendered by an SGG widget, through the same `renderFieldNode` → `getFieldConfig` → `renderWidget` path the SGG renderer uses.
- **Conversion:** `getFormData` converts the JSON Forms UI schema into an SGG UI schema with `prepareJsonFormsUiSchema` (`prepareUiSchema.ts`), which calls `convertJsonFormsUiSchema` (`convertUiSchema.ts`) and logs what the conversion drops. Navigation, validation warnings and the UI schema validator all read the converted SGG UI schema. `JsonFormsFields` receives the original JSON Forms UI schema and uses it to render the form.
- **Sections:** `FieldsetControl` renders a labeled group as a section, with the same fieldset, id (`form-section-<name>`) and classes as `FieldsetWidget`, named by its heading (`aria-labelledby`). Its heading is one level below the nearest heading (`headingLevel.tsx`), so a section inside a section is one level deeper. The form's sections are h4, set by `FORM_HEADING_LEVEL`.
- **Section descriptions:** A labeled group's `options.description` is markdown. `FieldsetControl` renders it above the section's fields with `MarkdownDescription`, which uses [`markdown-to-jsx`](https://github.com/quantizor/markdown-to-jsx). Raw HTML shows as text, a heading shows as a bold paragraph so the description never adds to the page outline, and links open in a new tab. A line indented 4 or more spaces becomes a code block, as in any markdown. This is how a form shows a long attestation or a burden statement.
- **Data paths:** JSON Forms gives every control its data path (`people.1.name`). The adapter reads each control at that path and passes it to `getFieldConfig`, which names, reads and matches warnings for a field in a list entry by the path, since the field's schema definition is the same for every entry. `src/utils/applyForm/dataPaths.ts` converts a data path to a schema definition, an HTML field name (`people[1]--name`) and a warning path (`$.people[1].name`).
- **Saving and validation:** These work the same way as for SGG forms. Every widget submits under its SGG field name in the HTML `<form>`. JSON Forms runs with `validationMode="NoValidation"` and only evaluates rules, against a copy of the answers that's refreshed from the `<form>` on every input.

## How controls map to SGG UI schema nodes

| JSON Forms element                      | SGG UI schema node(s)                                                                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Control on a scalar                     | One `field`                                                                                                                                                                |
| Control with `options.readonly: true`   | One `null` field (rendered disabled)                                                                                                                                       |
| Control with `options.widget`           | One `field` with that `widget`, if it names an SGG widget                                                                                                                  |
| Control on an object                    | One `field` per leaf of the object                                                                                                                                         |
| Control on a top-level array of objects | One `fieldList`, whose fields follow `options.detail` when it's set and the item schema otherwise. The list itself is rendered by `FieldListControl` (see [Lists](#lists)) |
| `Group` with a `label`                  | A `section` named with `groupName(label)`                                                                                                                                  |
| Any other layout                        | Its children, flattened into the parent                                                                                                                                    |

## How widgets are picked

`JsonFormsFields` picks a widget for each element by rank. Each widget is registered with a tester that scores how well it matches an element, and the highest score wins. A control that can't be rendered by an existing SGG widget is skipped, so the applicant doesn't see it, and the server logs a warning for it:

| Rank     | Widgets                                                                          | Used for                                                                     |
| -------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1        | `SkipControl`                                                                    | Controls that can't be rendered by an existing SGG widget, which are skipped |
| 10       | The SGG adapter (`AdaptedControl`, `AdaptedLayout`)                              | Everything else                                                              |
| Above 10 | JSON Forms controls, listed in `controls/index.ts` or passed as `extraRenderers` | Whatever their tester matches                                                |

See [Adding a new widget](../widgets/README.md#adding-a-new-widget) for an SGG widget, and [Adding a JSON Forms control](#adding-a-json-forms-control) below.

## Lists

A control on an array of objects or plain values is rendered by `FieldListControl` (`controls/FieldListControl/`), a JSON Forms control ranked above the SGG adapter. It matches a list at any path: at the form's root, inside an object (`budget.line_items`), or inside another list's entry (`people[].phones`). The SGG field-list widget isn't used in JSON Forms forms.

- **Entries:** JSON Forms stores the entries. Each entry is rendered with `JsonFormsDispatch` at its data path (`people.0`), using the control's `options.detail`, or a control per item property when there is no detail. A rule's condition is resolved against that entry, `FieldsetControl` renders a labeled group in an entry as a sub-section without a section id, and another `FieldListControl` renders a list in an entry.
- **Plain values:** An entry of a list of strings, numbers or booleans is dispatched as a control on the entry itself (`#`), which the SGG adapter renders as one field at the entry's data path (`places.0`, named `places[0]`). The control is labeled with the item schema's title, or the list's title when the item schema has none. A list of enum values or attachments is still rendered by the multi-select or attachment widget.
- **Labels:** A field is labeled with its control's `label` when the control has one, and with its schema's `title` otherwise, so a layout can override a question's title.
- **Fields:** Each field in an entry is rendered by its SGG widget, named, read and matched to its warnings by its data path (see [Data paths](#how-it-works)). `shapeFormData` already reads names at any depth (`people[0]--phones[1]--number`), so saving is unchanged. A field is required when every property between it and its entry is required (`isRequiredInListEntry`), since `getRequiredProperties` stops at lists.
- **Warnings:** A field shows the warnings whose `field` equals its path, built by `dataPathToWarningPath` (`$.people[0].phones[1].number`). Deleting an entry calls the form's `onFieldListEntryDelete`, the same callback the field-list widget calls.
- **Headings:** The list's title is one level below the nearest heading, and each entry's heading is one level below the title (`headingLevel.tsx`). Each entry's heading also describes the fields in that entry (`aria-describedby`). Below h6, headings use `aria-level`.
- **Add and delete:** The widget renders the same markup, classes and strings as the field-list widget, and respects the schema's `minItems` and `maxItems`.

### Known limitations

- **The converted SGG UI schema is unchanged.** `convertUiSchema` still converts only a top-level list to a `fieldList`, and still reports a list inside an object or an entry as unsupported and a rule inside an entry as ignored. Those server logs are now wrong; the tree and the logs need the same update as the field-list approach in HHS/simpler-grants-gov#13044.
- **The warnings summary** matches a field in a list only one level deep (`applyFormUtils`), so it doesn't link to a field in a nested list.
- **An object control whose object contains a list** isn't supported. The UI schema has to put a control on the list itself.
- **Minimum, maximum and delete-confirmation text** (`minItemsHeading`, `maxItemsHelperText`, etc.) from the SGG UI schema aren't supported. A JSON Forms UI schema has no equivalent options yet.

### Compared with reusing the field-list widget

The other approach (agilesix/simpler-grants-gov#72) reuses `FieldListWidget` for headings, add and delete, and adds a `renderEntry` prop so JSON Forms renders each entry.

|                                     | `FieldListControl` (this approach)                                                                                             | `FieldListWidget` with `renderEntry`                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Lists inside an object              | Supported                                                                                                                      | Supported, with the `fieldList` named by its path                                                    |
| Entry values                        | Read from JSON Forms' data, which is refreshed from the `<form>` on each input                                                 | A second copy in the widget's state, passed to JSON Forms through `renderEntry`                      |
| Changes to shared SGG code          | Optional `dataPath` and `widgetProps` parameters on `getFieldConfig` and `renderFieldNode`; hand-written forms don't pass them | `FieldListWidget`, `FieldListWidgetProps`, warning matching and `rebaseFieldListWarningsAfterDelete` |
| Duplicated code                     | The list markup, add and delete, and the min/max checks (about 130 lines, copied from `FieldListWidget`)                       | None                                                                                                 |
| Hand-written forms                  | Unaffected                                                                                                                     | Affected only by the `formContext` fix in `FieldListWidget`                                          |
| Behavior differences from SGG forms | Possible over time, since the list markup is a copy                                                                            | None: one widget renders both                                                                        |
| After the SGG renderer is removed   | Already the only list widget for JSON Forms                                                                                    | `FieldListWidget` would still have two modes                                                         |

## Adding a JSON Forms control

A JSON Forms control is ranked above the SGG adapter (rank 10), so it renders whatever its tester matches without an SGG widget. Each new control replaces an SGG widget for JSON Forms forms, one at a time. `FieldsetControl` is the simplest example:

1. Create `controls/<Name>Control/`, with the component in `<Name>Control.tsx` and its tests beside it. Put helpers that only this control uses in the same folder.
2. Export a registry entry (`{ tester, renderer }`) from the folder's `index.ts`, and add it to the list in `controls/index.ts`. `renderers.tsx` registers that list, so it doesn't change. (JSON Forms calls these entries "renderers".)
3. Rank the tester above 10, and match only the elements the component should render, by type or by a UI schema option.
4. Read the form's values, warnings, form context and print mode with `useAdapterContext()`.
5. Follow the same rules as the SGG widgets, because saving and validation still go through the HTML `<form>`:
   - **Field names:** Render inputs with the HTML field name for their data path (`dataPathToHtmlName`), the name the SGG widgets use. Otherwise the answers aren't saved.
   - **Validation warnings:** Read warnings from `AdapterContext` to show them on the control's fields.
   - **Print mode:** Check `print` in the same context so the print view works.
6. Dispatch any child elements at their data paths with `JsonFormsDispatch`. The adapter renders an SGG widget for each child control from its data path, so a control doesn't render its children's fields itself. If the control repeats content, like a list's entries, dispatch each repetition at its own data path (`people.0`) and wrap it in `HeadingLevel` with the repetition's heading as `fieldHeadingId`, so that heading describes each field inside.
