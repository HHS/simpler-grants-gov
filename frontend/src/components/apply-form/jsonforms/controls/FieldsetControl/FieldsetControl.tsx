"use client";

import {
  and,
  rankWith,
  uiTypeIs,
  type GroupLayout,
  type JsonFormsRendererRegistryEntry,
  type LayoutProps,
} from "@jsonforms/core";
import { JsonFormsDispatch, withJsonFormsLayoutProps } from "@jsonforms/react";
import { hasListIndex } from "src/utils/applyForm/dataPaths";

import { useId } from "react";
import { Fieldset, FormGroup } from "@trussworks/react-uswds";

import { useAdapterContext } from "src/components/apply-form/jsonforms/adapterContext";
import { groupName } from "src/components/apply-form/jsonforms/convertUiSchema";
import {
  Heading,
  HeadingLevel,
  useHeadingLevel,
} from "src/components/apply-form/jsonforms/headingLevel";
import { MarkdownDescription } from "src/components/apply-form/jsonforms/MarkdownDescription";

/** Rank above the SGG adapter (10), which would otherwise render the group with `FieldsetWidget`. */
const FIELDSET_RANK = 11;

/**
 * Render a labeled group as a form section: a fieldset with the id the form's navigation
 * links to (`form-section-<name>`), a heading one level below the nearest heading, and the
 * group's description as markdown. Use the same markup and classes as `FieldsetWidget`, so
 * JSON Forms forms and SGG forms look alike. Inside a list entry, render a smaller
 * sub-section without the id, since every entry repeats it.
 */
const FieldsetControl = ({
  uischema,
  schema,
  path,
  enabled,
  visible,
  renderers,
  cells,
}: LayoutProps) => {
  const context = useAdapterContext();
  const level = useHeadingLevel();
  const headingId = useId();
  if (!visible) return null;

  const layout = uischema as GroupLayout;
  const children = layout.elements.map((element, index) => (
    <JsonFormsDispatch
      key={`${path}-${index}`}
      uischema={element}
      schema={schema}
      path={path}
      enabled={enabled}
      renderers={renderers}
      cells={cells}
    />
  ));
  // Render the root group as the form itself, since the page already shows its title.
  if (uischema === context.rootUiSchema) return <>{children}</>;

  const label = layout.label ?? "";
  const description = layout.options?.description as string | undefined;
  const inEntry = hasListIndex(path);
  return (
    <Fieldset
      id={inEntry ? undefined : `form-section-${groupName(label)}`}
      className={inEntry ? "margin-top-3" : undefined}
      // Name the section by its heading, so assistive technology announces it.
      aria-labelledby={headingId}
    >
      <FormGroup className="simpler-formgroup">
        <Heading
          level={level + 1}
          id={headingId}
          className={
            inEntry
              ? "text-bold font-sans-sm margin-top-0"
              : "usa-legend font-sans-lg margin-bottom-05 margin-top-5"
          }
        >
          {label}
        </Heading>
        {description ? <MarkdownDescription text={description} /> : null}
        {/* Set the section's heading level, so a heading inside the section is one level below it. */}
        <HeadingLevel level={level + 1}>{children}</HeadingLevel>
      </FormGroup>
    </Fieldset>
  );
};

/** Render a labeled group as a form section. */
export const fieldsetControl: JsonFormsRendererRegistryEntry = {
  tester: rankWith(
    FIELDSET_RANK,
    and(uiTypeIs("Group"), (uischema) =>
      Boolean((uischema as GroupLayout).label),
    ),
  ),
  renderer: withJsonFormsLayoutProps(FieldsetControl),
};
