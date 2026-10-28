import { crumbAttributes, headingTag } from "@/lib/breadcrumbs";
import {
  entryActivity,
  entryFields,
  entryLayout,
  entryTitle,
  summarySections,
  type EntryNode,
  type SummaryItem,
} from "@/lib/collapsible";
import type { ControlProps, UISchemaElement } from "@jsonforms/core";
import { renderWidget } from "@sgg/frontend/components/apply-form/widgets/WidgetRenderers";
import type { FormattedFormValidationWarning } from "@sgg/frontend/types/applyForm/types";
import { isFieldRequired } from "@sgg/frontend/utils/applyForm/applyFormUtils";
import { getFieldListChildErrors } from "@sgg/frontend/utils/applyForm/fieldListHelpers";
import { getFieldConfig } from "@sgg/frontend/utils/applyForm/getFieldConfig";
import { useContext, useId, useRef, useState, type ReactNode } from "react";

import { controlToNodes } from "../../../../vendor/sgg/jsonFormsUiSchema";
import { AdapterContext } from "../../../../vendor/sgg/renderers";
import { SectionDepth } from "../sections/SectionDepth";
import CollapsibleHeader from "./CollapsibleHeader";
import SummaryList from "./SummaryList";

type Value = Record<string, unknown>;

/** One child field of the list, as `getFieldConfig` describes it for the stock FieldList. */
interface ListItem {
  widget: string;
  generalProps: Record<string, unknown> & {
    schema?: { title?: string };
    options?: { enumOptions?: { value: unknown; label: string }[] };
  };
  baseId: string;
  definition: string;
  storagePath: string[];
}

interface ListProps {
  name: string;
  label?: string;
  description?: string;
  minItems?: number;
  maxItems?: number;
  groupDefinition: ListItem[];
  value?: Value[];
  rawErrors?: FormattedFormValidationWarning[];
  requiredFields?: string[];
  detail?: UISchemaElement;
  disabled?: boolean;
  onChange?: (values: Value[]) => void;
  /** How many sections enclose the list, which sets its heading levels. */
  depth: number;
}

interface Entry {
  id: number;
  value: Value;
  collapsed: boolean;
}

const INDEX_TOKEN = "~~index~~";

const valueAt = (value: Value, path: string[]): unknown =>
  path.reduce<unknown>(
    (current, part) =>
      current && typeof current === "object" && !Array.isArray(current)
        ? (current as Value)[part]
        : undefined,
    value,
  );

const withValueAt = (
  value: Value,
  [head, ...rest]: string[],
  next: unknown,
): Value => {
  if (!head) return value;
  if (!rest.length) return { ...value, [head]: next };
  const nested = value[head];
  return {
    ...value,
    [head]: withValueAt(
      nested && typeof nested === "object" && !Array.isArray(nested)
        ? (nested as Value)
        : {},
      rest,
      next,
    ),
  };
};

const ATTACHMENTS = new Set(["Attachment", "AttachmentArray"]);

/**
 * A FieldList whose entries each collapse to a read-only list of their answers, and whose
 * entries draw the groups their layout gives them (Name, Address) as flat sections rather than
 * one run of fields. Entries are stored and named exactly as the stock FieldList stores them,
 * so the form saves the same data. Its headings are breadcrumb anchors like every section's.
 */
function CollapsibleFieldList({
  name,
  label = "Entry",
  description,
  minItems = 0,
  maxItems,
  groupDefinition,
  value,
  rawErrors,
  requiredFields = [],
  detail,
  disabled = false,
  onChange,
  depth,
}: ListProps) {
  const headingId = useId();
  const nextId = useRef(0);
  const entry = (entryValue: Value): Entry => ({
    id: nextId.current++,
    value: entryValue,
    collapsed: Object.keys(entryValue).length > 0,
  });
  const [entries, setEntries] = useState<Entry[]>(() => {
    const saved = (Array.isArray(value) ? value : []).map(entry);
    while (saved.length < minItems) saved.push(entry({}));
    return saved;
  });
  const currentEntries = useRef(entries);
  const commit = (next: Entry[]) => {
    currentEntries.current = next;
    setEntries(next);
    onChange?.(next.map((e) => e.value));
  };

  const layout = entryLayout(detail, groupDefinition);
  const listPath = `$.${name}`;
  const canAdd =
    !disabled && (maxItems === undefined || entries.length < maxItems);
  const canDelete = !disabled && entries.length > minItems;
  const level = depth + 1;
  const ListHeading = headingTag(level);

  return (
    <div
      id={name}
      className="field-list-widget collapsible-list border border-base-lighter radius-md padding-2 margin-y-2"
    >
      <div className="collapsible-list__heading">
        <ListHeading
          className={`margin-0 form-section__heading--${level}`}
          {...crumbAttributes(headingId, label, level)}
        >
          {label}
        </ListHeading>
        {maxItems !== undefined && (
          <span className="collapsible-list__count">
            {entries.length} of {maxItems} entries
          </span>
        )}
      </div>
      {description && <p>{description}</p>}

      {entries.map((current, index) => (
        <ListEntry
          key={current.id}
          entry={current}
          index={index}
          name={name}
          label={label}
          level={level + 1}
          layout={layout}
          listPath={listPath}
          rawErrors={rawErrors}
          requiredFields={requiredFields}
          disabled={disabled}
          canDelete={canDelete}
          onToggle={() => {
            const next = currentEntries.current.map((e) =>
              e.id === current.id ? { ...e, collapsed: !e.collapsed } : e,
            );
            currentEntries.current = next;
            setEntries(next);
          }}
          onChange={(path, next) =>
            commit(
              currentEntries.current.map((e) =>
                e.id === current.id
                  ? { ...e, value: withValueAt(e.value, path, next) }
                  : e,
              ),
            )
          }
          onDelete={() =>
            commit(currentEntries.current.filter((e) => e.id !== current.id))
          }
        />
      ))}

      <button
        type="button"
        className="usa-button usa-button--outline margin-top-2"
        disabled={!canAdd}
        onClick={() =>
          commit([
            ...currentEntries.current,
            { ...entry({}), collapsed: false },
          ])
        }
      >
        Add entry
      </button>
    </div>
  );
}

function ListEntry({
  entry,
  index,
  name,
  label,
  level,
  layout,
  listPath,
  rawErrors,
  requiredFields,
  disabled,
  canDelete,
  onToggle,
  onChange,
  onDelete,
}: {
  entry: Entry;
  index: number;
  name: string;
  label: string;
  level: number;
  layout: EntryNode<ListItem>[];
  listPath: string;
  rawErrors?: FormattedFormValidationWarning[];
  requiredFields: string[];
  disabled: boolean;
  canDelete: boolean;
  onToggle: () => void;
  onChange: (path: string[], next: unknown) => void;
  onDelete: () => void;
}) {
  const headingId = useId();
  const number = index + 1;
  const errorsFor = (item: ListItem) =>
    getFieldListChildErrors({
      rawErrors,
      fieldListPath: listPath,
      entryIndex: index,
      storagePath: item.storagePath,
      childDefinition: item.definition,
    });
  const summaryOf = (
    item: ListItem,
  ): SummaryItem & { storagePath: string[] } => ({
    label: item.generalProps.schema?.title ?? item.storagePath.at(-1) ?? "",
    value: valueAt(entry.value, item.storagePath),
    required: isFieldRequired(item.definition, requiredFields),
    enumOptions: item.generalProps.options?.enumOptions,
    attachment: ATTACHMENTS.has(item.widget),
    storagePath: item.storagePath,
  });
  const activity = entryActivity(layout, entry.value);
  const renderItem = (item: ListItem) => {
    const state = activity.get(item);
    if (state?.visible === false) return null;
    const inactive = disabled || state?.enabled === false;
    const id = item.baseId.replace(INDEX_TOKEN, String(index));
    return renderWidget({
      type: item.widget,
      props: {
        ...item.generalProps,
        id,
        name: id,
        key: `${entry.id}-${item.storagePath.join(".")}`,
        value: valueAt(entry.value, item.storagePath),
        rawErrors: errorsFor(item),
        required: isFieldRequired(item.definition, requiredFields),
        updateOnInput: true,
        additionalDescribedById: headingId,
        disabled: inactive,
        readOnly: inactive,
        isFormLocked: inactive,
        onChange: (next: unknown) => onChange(item.storagePath, next),
      },
    });
  };
  const fields = entryFields(layout);
  const errorCount = fields.reduce(
    (sum, item) => sum + errorsFor(item).length,
    0,
  );
  return (
    <div
      id={`${name}-entry-${number}`}
      className={`collapsible collapsible--entry${entry.collapsed ? "" : " collapsible--open"}${entry.collapsed && errorCount ? " collapsible--error" : ""}`}
    >
      <CollapsibleHeader
        headingId={headingId}
        label={`${label} ${number}`}
        level={level}
        title={
          <>
            <span className="collapsible__number">{number}</span>
            <span className="collapsible__title">
              {entryTitle(fields.map(summaryOf), `${label} ${number}`)}
            </span>
          </>
        }
        collapsed={entry.collapsed}
        errorCount={errorCount}
        onToggle={onToggle}
        actions={
          <button
            type="button"
            className="usa-button usa-button--unstyled collapsible__action collapsible__action--danger"
            disabled={!canDelete}
            onClick={onDelete}
          >
            Delete
          </button>
        }
      />
      {entry.collapsed && (
        <SummaryList sections={summarySections(layout, summaryOf)} />
      )}
      <div className="collapsible__body" hidden={entry.collapsed}>
        <EntryNodes nodes={layout} level={level + 1} renderItem={renderItem} />
      </div>
    </div>
  );
}

/** An entry's fields, and its groups as flat sections headed at `level`. */
function EntryNodes({
  nodes,
  level,
  renderItem,
}: {
  nodes: EntryNode<ListItem>[];
  level: number;
  renderItem: (item: ListItem) => ReactNode;
}) {
  return nodes.map((node, index) =>
    node.kind === "field" ? (
      renderItem(node.field)
    ) : (
      <EntryGroup
        key={index}
        node={node}
        level={level}
        renderItem={renderItem}
      />
    ),
  );
}

function EntryGroup({
  node,
  level,
  renderItem,
}: {
  node: Extract<EntryNode<ListItem>, { kind: "group" }>;
  level: number;
  renderItem: (item: ListItem) => ReactNode;
}) {
  const headingId = useId();
  const Heading = headingTag(level);
  return (
    <fieldset className="usa-fieldset form-section">
      <Heading
        className={`form-section__heading form-section__heading--${level}`}
        {...crumbAttributes(headingId, node.label, level)}
      >
        {node.label}
      </Heading>
      <EntryNodes
        nodes={node.children}
        level={level + 1}
        renderItem={renderItem}
      />
    </fieldset>
  );
}

/** The JSON Forms control for a list tagged `CollapsibleFieldList`. */
export function CollapsibleListControl({
  uischema,
  visible,
  enabled,
}: ControlProps) {
  const context = useContext(AdapterContext);
  const depth = useContext(SectionDepth);
  if (!visible || !context) return null;
  const [node] = controlToNodes(uischema, context.schema);
  if (node?.type !== "fieldList") return null;
  const config = getFieldConfig({
    uiFieldObject: node,
    formSchema: context.schema,
    errors: context.errors ?? null,
    formData: context.formData,
    requiredField: false,
  });
  // `key` is React's, not a prop: spread it and React warns.
  const props = Object.fromEntries(
    Object.entries(config.props).filter(([name]) => name !== "key"),
  );
  const rendered = (
    <CollapsibleFieldList
      {...(props as unknown as Omit<ListProps, "depth">)}
      detail={
        (uischema.options as { detail?: UISchemaElement } | undefined)?.detail
      }
      disabled={!enabled || !!context.isFormLocked}
      depth={depth}
      onChange={
        context.onFieldListChange
          ? (values) => context.onFieldListChange!(node.name, values)
          : undefined
      }
    />
  );
  // The list's callback owns its values; bubbling edits must not create another writer.
  return context.onFieldListChange ? (
    <div
      onInput={(event) => event.stopPropagation()}
      onChange={(event) => event.stopPropagation()}
    >
      {rendered}
    </div>
  ) : (
    rendered
  );
}
