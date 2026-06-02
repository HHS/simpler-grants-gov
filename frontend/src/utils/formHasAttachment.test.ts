import type { UiSchema } from "src/types/applyForm/types";
import { formHasAttachmentFields } from "src/utils/formHasAttachment";

describe("formHasAttachmentFields", () => {
  it("returns false for an empty schema", () => {
    expect(formHasAttachmentFields([])).toBe(false);
  });

  it("returns false when no fields have Attachment widgets", () => {
    const schema: UiSchema = [
      {
        type: "field",
        definition: "/properties/name",
        widget: "Text",
      },
      {
        type: "field",
        definition: "/properties/email",
        widget: "TextArea",
      },
    ];
    expect(formHasAttachmentFields(schema)).toBe(false);
  });

  it("returns true when a top-level field has an Attachment widget", () => {
    const schema: UiSchema = [
      {
        type: "field",
        definition: "/properties/resume",
        widget: "Attachment",
      },
    ];
    expect(formHasAttachmentFields(schema)).toBe(true);
  });

  it("returns true for AttachmentArray widget", () => {
    const schema: UiSchema = [
      {
        type: "field",
        definition: "/properties/files",
        widget: "AttachmentArray",
      },
    ];
    expect(formHasAttachmentFields(schema)).toBe(true);
  });

  it("returns false for PrintAttachment widget (prefix does not match)", () => {
    // The match is `widget.startsWith("Attachment")`, so "PrintAttachment"
    // intentionally does not count as an attachment field.
    const schema: UiSchema = [
      {
        type: "field",
        definition: "/properties/docs",
        widget: "PrintAttachment",
      },
    ];
    expect(formHasAttachmentFields(schema)).toBe(false);
  });

  it("returns false when field has no widget", () => {
    const schema: UiSchema = [
      {
        type: "field",
        definition: "/properties/name",
      },
    ];
    expect(formHasAttachmentFields(schema)).toBe(false);
  });

  it("returns true when a nested section contains an Attachment field", () => {
    const schema: UiSchema = [
      {
        type: "section",
        label: "Documents",
        name: "documents",
        children: [
          {
            type: "field",
            definition: "/properties/cover_letter",
            widget: "Text",
          },
          {
            type: "field",
            definition: "/properties/attachment",
            widget: "Attachment",
          },
        ],
      },
    ];
    expect(formHasAttachmentFields(schema)).toBe(true);
  });

  it("returns false for nested sections without Attachment widgets", () => {
    const schema: UiSchema = [
      {
        type: "section",
        label: "Personal Info",
        name: "personal",
        children: [
          {
            type: "field",
            definition: "/properties/name",
            widget: "Text",
          },
        ],
      },
    ];
    expect(formHasAttachmentFields(schema)).toBe(false);
  });

  it("handles deeply nested sections with Attachment fields", () => {
    const schema: UiSchema = [
      {
        type: "section",
        label: "Level 1",
        name: "level1",
        children: [
          {
            type: "section",
            label: "Level 2",
            name: "level2",
            children: [
              {
                type: "field",
                definition: "/properties/deep_attachment",
                widget: "Attachment",
              },
            ],
          },
        ],
      },
    ];
    expect(formHasAttachmentFields(schema)).toBe(true);
  });

  it("returns false for an Attachment field nested in a fieldList (not recursed into)", () => {
    // formHasAttachmentFields only recurses into `section` children, not
    // `fieldList` children, so an Attachment nested in a fieldList is not
    // currently detected. This documents that intentional behavior.
    const schema: UiSchema = [
      {
        type: "fieldList",
        label: "Attachments",
        name: "attachments",
        children: [
          {
            type: "field",
            definition: "/properties/file",
            widget: "Attachment",
          },
        ],
      },
    ];
    expect(formHasAttachmentFields(schema)).toBe(false);
  });

  it("returns true when mix of Attachment and non-Attachment fields exist", () => {
    const schema: UiSchema = [
      {
        type: "field",
        definition: "/properties/name",
        widget: "Text",
      },
      {
        type: "field",
        definition: "/properties/file",
        widget: "Attachment",
      },
      {
        type: "field",
        definition: "/properties/email",
        widget: "TextArea",
      },
    ];
    expect(formHasAttachmentFields(schema)).toBe(true);
  });
});
