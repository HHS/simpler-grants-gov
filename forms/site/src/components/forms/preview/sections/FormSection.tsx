import { crumbAttributes, headingTag } from "@/lib/breadcrumbs";
import type { GroupLayout, LayoutProps } from "@jsonforms/core";
import { JsonFormsDispatch } from "@jsonforms/react";
import { useContext, useId } from "react";

import { groupName } from "../../../../vendor/sgg/jsonFormsUiSchema";
import { AdapterContext } from "../../../../vendor/sgg/renderers";
import { SectionDepth } from "./SectionDepth";

/**
 * A labeled group, drawn flat like the SGG fieldset but with a heading sized to its depth, so
 * a section inside another reads as part of it without any indenting. Its heading is a
 * breadcrumb anchor, followed by the group's description. The root layout is the form itself
 * and stays a plain run of fields.
 */
export default function FormSection({
  uischema,
  schema,
  path,
  enabled,
  visible,
  renderers,
  cells,
}: LayoutProps) {
  const context = useContext(AdapterContext);
  const depth = useContext(SectionDepth);
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
  if (uischema === context?.rootUiSchema || !layout.label)
    return <>{children}</>;

  const level = depth + 1;
  const name = groupName(layout.label);
  // Shown as the SGG fieldset shows a section's description: a paragraph per line.
  const description = layout.options?.description as string | undefined;
  const help = description
    ?.split("\n")
    .filter(Boolean)
    .map((paragraph, i) => (
      <p
        key={`${name}-section-description-paragraph-${i}`}
        className="usa-hint form-section__description"
      >
        {paragraph}
      </p>
    ));
  const Heading = headingTag(level);
  return (
    <fieldset className="usa-fieldset form-section" id={`form-section-${name}`}>
      <Heading
        className={`form-section__heading form-section__heading--${level}`}
        {...crumbAttributes(headingId, layout.label, level)}
      >
        {layout.label}
      </Heading>
      {layout.options?.widget === "SectionHelp" && description ? (
        <details className="margin-y-2">
          <summary
            aria-label={`${layout.label}: instructions and option definitions`}
          >
            Instructions and option definitions
          </summary>
          {help}
        </details>
      ) : (
        help
      )}
      <SectionDepth.Provider value={level}>{children}</SectionDepth.Provider>
    </fieldset>
  );
}
