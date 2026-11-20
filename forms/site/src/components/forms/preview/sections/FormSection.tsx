import { crumbAttributes, headingTag } from "@/lib/breadcrumbs";
import type { GroupLayout, LayoutProps } from "@jsonforms/core";
import { JsonFormsDispatch } from "@jsonforms/react";
import { groupName } from "@sgg/frontend/components/apply-form/jsonforms/convertUiSchema";
import { HeadingLevel } from "@sgg/frontend/components/apply-form/jsonforms/headingLevel";
import { MarkdownDescription } from "@sgg/frontend/components/apply-form/jsonforms/MarkdownDescription";
import { AdapterContext } from "@sgg/frontend/components/apply-form/jsonforms/renderers";
import { useContext, useId } from "react";

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
  const description = layout.options?.description as string | undefined;
  const Heading = headingTag(level);
  return (
    <fieldset className="usa-fieldset form-section" id={`form-section-${name}`}>
      <Heading
        className={`form-section__heading form-section__heading--${level}`}
        {...crumbAttributes(headingId, layout.label, level)}
      >
        {layout.label}
      </Heading>
      {/* Render the description with the apply form's component, so the preview matches it. */}
      {description ? (
        <div className="usa-hint form-section__description">
          <MarkdownDescription text={description} />
        </div>
      ) : null}
      <SectionDepth.Provider value={level}>
        {/* Set the frontend's heading level too, so a list in the section is headed below it. */}
        <HeadingLevel level={Number(Heading.slice(1))}>{children}</HeadingLevel>
      </SectionDepth.Provider>
    </fieldset>
  );
}
