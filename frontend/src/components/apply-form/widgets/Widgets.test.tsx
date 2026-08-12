import { render } from "@testing-library/react";
import { UswdsWidgetProps } from "src/types/applyForm/types";

import { widgetComponents } from "./Widgets";

/*
  Covers the temporary virus scanning rollout gate: which attachment widget the
  Attachment and AttachmentArray widget types resolve to. Removed along with the gate
  in #11352.
*/

const mockLegacyAttachmentWidget = jest.fn();
const mockLegacyMultipleAttachmentWidget = jest.fn();
const mockVirusScanningAttachmentWidget = jest.fn();
const mockVirusScanningMultipleAttachmentWidget = jest.fn();

jest.mock("./AttachmentUploadWidget", () => ({
  __esModule: true,
  default: (props: unknown) => mockLegacyAttachmentWidget(props) as unknown,
}));

jest.mock("./MultipleAttachmentUploadWidget", () => ({
  __esModule: true,
  default: (props: unknown) =>
    mockLegacyMultipleAttachmentWidget(props) as unknown,
}));

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

const buildProps = (
  widgetSupport: Partial<{
    useSingleAttachmentVirusScanning: boolean;
    useMultipleAttachmentVirusScanning: boolean;
  }>,
): UswdsWidgetProps => ({
  id: "attachment_field",
  schema: { type: "string", title: "Attachment field" },
  rawErrors: [],
  formContext: {
    widgetSupport: {
      useSingleAttachmentVirusScanning: false,
      useMultipleAttachmentVirusScanning: false,
      ...widgetSupport,
    },
  },
});

const renderWidgetType = (
  type: "Attachment" | "AttachmentArray",
  props: UswdsWidgetProps,
) => render(<>{widgetComponents[type](props)}</>);

describe("widgetComponents attachment selection", () => {
  afterEach(() => jest.clearAllMocks());

  describe("AttachmentArray", () => {
    it("uses the virus scanning widget when multiple attachment virus scanning is enabled", () => {
      renderWidgetType(
        "AttachmentArray",
        buildProps({ useMultipleAttachmentVirusScanning: true }),
      );

      expect(mockVirusScanningMultipleAttachmentWidget).toHaveBeenCalledTimes(
        1,
      );
      expect(mockLegacyMultipleAttachmentWidget).not.toHaveBeenCalled();
    });

    it("uses the legacy widget when multiple attachment virus scanning is disabled", () => {
      renderWidgetType(
        "AttachmentArray",
        buildProps({ useMultipleAttachmentVirusScanning: false }),
      );

      expect(mockLegacyMultipleAttachmentWidget).toHaveBeenCalledTimes(1);
      expect(mockVirusScanningMultipleAttachmentWidget).not.toHaveBeenCalled();
    });

    it("uses the legacy widget when there is no widget support in context", () => {
      renderWidgetType("AttachmentArray", {
        id: "attachment_field",
        schema: { type: "string" },
        rawErrors: [],
      });

      expect(mockLegacyMultipleAttachmentWidget).toHaveBeenCalledTimes(1);
      expect(mockVirusScanningMultipleAttachmentWidget).not.toHaveBeenCalled();
    });

    // the property is optional, so widgetSupport fixtures that predate it (#11902) must
    // still resolve to the legacy widget rather than undefined behavior
    it("uses the legacy widget when the multiple attachment gate is omitted", () => {
      renderWidgetType("AttachmentArray", {
        id: "attachment_field",
        schema: { type: "string" },
        rawErrors: [],
        formContext: {
          widgetSupport: { useSingleAttachmentVirusScanning: true },
        },
      });

      expect(mockLegacyMultipleAttachmentWidget).toHaveBeenCalledTimes(1);
      expect(mockVirusScanningMultipleAttachmentWidget).not.toHaveBeenCalled();
    });

    it("is not switched by the single attachment gate", () => {
      renderWidgetType(
        "AttachmentArray",
        buildProps({
          useSingleAttachmentVirusScanning: true,
          useMultipleAttachmentVirusScanning: false,
        }),
      );

      expect(mockLegacyMultipleAttachmentWidget).toHaveBeenCalledTimes(1);
      expect(mockVirusScanningMultipleAttachmentWidget).not.toHaveBeenCalled();
    });
  });

  describe("Attachment", () => {
    it("is not switched by the multiple attachment gate", () => {
      renderWidgetType(
        "Attachment",
        buildProps({
          useSingleAttachmentVirusScanning: false,
          useMultipleAttachmentVirusScanning: true,
        }),
      );

      expect(mockLegacyAttachmentWidget).toHaveBeenCalledTimes(1);
      expect(mockVirusScanningAttachmentWidget).not.toHaveBeenCalled();
    });

    it("still uses the virus scanning widget when the single attachment gate is enabled", () => {
      renderWidgetType(
        "Attachment",
        buildProps({ useSingleAttachmentVirusScanning: true }),
      );

      expect(mockVirusScanningAttachmentWidget).toHaveBeenCalledTimes(1);
      expect(mockLegacyAttachmentWidget).not.toHaveBeenCalled();
    });

    it("uses the legacy widget when both gates are disabled", () => {
      renderWidgetType("Attachment", buildProps({}));

      expect(mockLegacyAttachmentWidget).toHaveBeenCalledTimes(1);
      expect(mockVirusScanningAttachmentWidget).not.toHaveBeenCalled();
    });
  });

  describe("Print rendering", () => {
    it("uses a non editable renderer for print attachments", () => {
      // print forms swap attachment fields to the PrintAttachment widget, which is
      // separate from both upload widgets and renders no controls
      expect(widgetComponents.PrintAttachment).not.toBe(
        widgetComponents.AttachmentArray,
      );
      renderWidgetType(
        "AttachmentArray",
        buildProps({ useMultipleAttachmentVirusScanning: true }),
      );
      expect(mockVirusScanningMultipleAttachmentWidget).toHaveBeenCalledTimes(
        1,
      );
    });
  });
});
