import { render } from "@testing-library/react";
import { UswdsWidgetProps } from "src/types/applyForm/types";

import { widgetComponents } from "./Widgets";

const mockVirusScanningAttachmentWidget = jest.fn();
const mockVirusScanningMultipleAttachmentWidget = jest.fn();

jest.mock("./ApplicationAttachmentWidget", () => ({
  __esModule: true,
  default: (props: unknown) =>
    mockVirusScanningAttachmentWidget(props) as unknown,
}));

jest.mock("./ApplicationMultipleAttachmentWidget", () => ({
  __esModule: true,
  default: (props: unknown) =>
    mockVirusScanningMultipleAttachmentWidget(props) as unknown,
}));

const baseProps: UswdsWidgetProps = {
  id: "attachment_field",
  schema: { type: "string", title: "Attachment field" },
  rawErrors: [],
};

const renderWidgetType = (
  type: "Attachment" | "AttachmentArray",
  props: UswdsWidgetProps = baseProps,
) => render(<>{widgetComponents[type](props)}</>);

describe("widgetComponents attachment selection", () => {
  afterEach(() => jest.clearAllMocks());

  describe("Attachment", () => {
    it("always uses the virus scanning single attachment widget", () => {
      renderWidgetType("Attachment");

      expect(mockVirusScanningAttachmentWidget).toHaveBeenCalledTimes(1);
      expect(mockVirusScanningMultipleAttachmentWidget).not.toHaveBeenCalled();
    });

    it("does not require any widget support in context", () => {
      renderWidgetType("Attachment", { ...baseProps, formContext: {} });

      expect(mockVirusScanningAttachmentWidget).toHaveBeenCalledTimes(1);
    });

    it("does not depend on the form supplying widget support flags", () => {
      renderWidgetType("Attachment", {
        ...baseProps,
        formContext: { widgetSupport: { markFormDirty: jest.fn() } },
      });

      expect(mockVirusScanningAttachmentWidget).toHaveBeenCalledTimes(1);
    });
  });

  describe("AttachmentArray", () => {
    it("always uses the virus scanning multiple attachment widget", () => {
      renderWidgetType("AttachmentArray");

      expect(mockVirusScanningMultipleAttachmentWidget).toHaveBeenCalledTimes(
        1,
      );
      expect(mockVirusScanningAttachmentWidget).not.toHaveBeenCalled();
    });

    it("does not require any widget support in context", () => {
      renderWidgetType("AttachmentArray", { ...baseProps, formContext: {} });

      expect(mockVirusScanningMultipleAttachmentWidget).toHaveBeenCalledTimes(
        1,
      );
    });

    it("does not depend on the form supplying widget support flags", () => {
      renderWidgetType("AttachmentArray", {
        ...baseProps,
        formContext: { widgetSupport: { markFormDirty: jest.fn() } },
      });

      expect(mockVirusScanningMultipleAttachmentWidget).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  describe("Print rendering", () => {
    it("uses a non editable renderer for print attachments", () => {
      // print forms swap attachment fields to the PrintAttachment widget, which is
      // separate from both upload widgets and renders no controls
      expect(widgetComponents.PrintAttachment).not.toBe(
        widgetComponents.Attachment,
      );
      expect(widgetComponents.PrintAttachment).not.toBe(
        widgetComponents.AttachmentArray,
      );
    });
  });
});
