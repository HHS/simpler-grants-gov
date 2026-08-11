/**
 * @jest-environment ./src/utils/testing/jsdomNodeEnvironment.ts
 */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UswdsWidgetProps } from "src/types/applyForm/types";
import { Attachment } from "src/types/attachmentTypes";

import ApplicationMultipleAttachmentWidget from "src/components/apply-form/widgets/ApplicationMultipleAttachmentWidget";

/*
  SimplerFileInput is deliberately NOT mocked - driving the real file input, file rows and
  errors means accessibility and locked/read-only behavior are asserted against the DOM a
  user and a screen reader would actually encounter.
*/

type UseApplicationAttachmentsResult = {
  attachments: Attachment[] | null;
};

const mockUseApplicationAttachments = jest.fn<
  UseApplicationAttachmentsResult,
  []
>();
jest.mock("src/hooks/ApplicationAttachments", () => ({
  useApplicationAttachments: (): UseApplicationAttachmentsResult =>
    mockUseApplicationAttachments(),
}));

// the upload stream fetch and the create-attachment fetch both go through useClientFetch
const clientFetchMock = jest.fn();
jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: unknown[]) => clientFetchMock(...args) as unknown,
  }),
}));

jest.mock("next/navigation", () => ({
  useParams: () => ({ applicationId: "app-123" }),
}));

const fakeAbortController = jest.fn();
const fakeTextDecoder = jest.fn();
const fakeFileReader = jest.fn();

const buildAttachment = (
  attachmentId: string,
  overrides: Partial<Attachment> = {},
): Attachment => ({
  application_attachment_id: attachmentId,
  file_name: `${attachmentId}.pdf`,
  download_path: `/download/${attachmentId}`,
  file_size_bytes: 1024,
  mime_type: "application/pdf",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

const attachmentOne = buildAttachment("uuid-1", { file_name: "budget.pdf" });
const attachmentTwo = buildAttachment("uuid-2", { file_name: "narrative.pdf" });

const defaultProps: UswdsWidgetProps = {
  id: "additional_project_title",
  required: false,
  schema: {
    type: "array",
    title: "Additional Project Title",
  },
  value: undefined,
  rawErrors: [],
};

const getHiddenInput = (container: HTMLElement) =>
  // eslint-disable-next-line testing-library/no-node-access
  container.querySelector<HTMLInputElement>(
    'input[type="hidden"][name="additional_project_title"]',
  );

const hiddenValue = (container: HTMLElement): string[] =>
  JSON.parse(getHiddenInput(container)?.value ?? "[]") as string[];

// a scan response stream that emits a single terminal chunk and closes
const makeScanStream = (chunk: object) =>
  new ReadableStream({
    start: (controller) => {
      controller.enqueue(JSON.stringify(chunk));
      controller.close();
    },
  });

/*
  Queues successful uploads: each streamed scan response yields a pending file id, then
  the create-attachment POST resolves with the next attachment in the list. Both requests
  go through the same clientFetch mock, so they are distinguished by url. Once the
  attachment list is exhausted, further create calls reject - which is how the mixed
  success/failure batches below are set up.
*/
const mockUploadThenCreate = (attachments: Attachment[]) => {
  let uploadCount = 0;
  let createCount = 0;

  clientFetchMock.mockImplementation((url: string) => {
    if (url === "/api/file") {
      const pendingFileId = `pending-${uploadCount}`;
      uploadCount += 1;
      return Promise.resolve(
        new Response(makeScanStream({ status: "complete", pendingFileId })),
      );
    }
    const attachment = attachments[createCount];
    createCount += 1;
    return attachment
      ? Promise.resolve({ data: attachment })
      : Promise.reject(new Error("create failed"));
  });
};

describe("ApplicationMultipleAttachmentWidget", () => {
  beforeEach(() => {
    global.AbortController = fakeAbortController;
    fakeAbortController.mockImplementation(() => ({
      abort: jest.fn(),
      signal: { abort: jest.fn() },
    }));
    fakeTextDecoder.mockImplementation(() => ({
      decode: (value: unknown) => value,
    }));
    global.TextDecoder = fakeTextDecoder;
    fakeFileReader.mockImplementation(() => ({ readAsDataURL: jest.fn() }));
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.FileReader = fakeFileReader;

    mockUseApplicationAttachments.mockReturnValue({ attachments: [] });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("Initialization from saved values and context", () => {
    it("starts empty when there is no saved value", () => {
      const { container } = render(
        <ApplicationMultipleAttachmentWidget {...defaultProps} />,
      );

      expect(hiddenValue(container)).toEqual([]);
      expect(
        screen.queryByTestId("file-input-existing-files"),
      ).not.toBeInTheDocument();
    });

    it("initializes from a saved array of attachment ids", () => {
      mockUseApplicationAttachments.mockReturnValue({
        attachments: [attachmentOne, attachmentTwo],
      });

      const { container } = render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={["uuid-1", "uuid-2"]}
        />,
      );

      expect(hiddenValue(container)).toEqual(["uuid-1", "uuid-2"]);
      expect(screen.getByText("budget.pdf")).toBeInTheDocument();
      expect(screen.getByText("narrative.pdf")).toBeInTheDocument();
    });

    it("initializes from a saved JSON string value", () => {
      mockUseApplicationAttachments.mockReturnValue({
        attachments: [attachmentOne],
      });

      const { container } = render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={JSON.stringify(["uuid-1"])}
        />,
      );

      expect(hiddenValue(container)).toEqual(["uuid-1"]);
      expect(screen.getByText("budget.pdf")).toBeInTheDocument();
    });

    it("ignores a value that is not a list of ids", () => {
      const { container } = render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={{ nope: true }}
        />,
      );

      expect(hiddenValue(container)).toEqual([]);
    });

    it("keeps the saved order rather than the context order", () => {
      mockUseApplicationAttachments.mockReturnValue({
        attachments: [attachmentTwo, attachmentOne],
      });

      render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={["uuid-1", "uuid-2"]}
        />,
      );

      const rows = screen.getByTestId("file-input-existing-files");
      expect(rows).toHaveTextContent(/budget\.pdf[\s\S]*narrative\.pdf/);
    });

    it("shows a placeholder name when context has no metadata for a saved id", () => {
      mockUseApplicationAttachments.mockReturnValue({ attachments: null });

      render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={["uuid-1"]}
        />,
      );

      expect(
        screen.getByText("(Previously uploaded file)"),
      ).toBeInTheDocument();
    });

    it("picks up file names when attachment context arrives after mount", () => {
      mockUseApplicationAttachments.mockReturnValue({ attachments: null });
      const { rerender } = render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={["uuid-1"]}
        />,
      );
      expect(
        screen.getByText("(Previously uploaded file)"),
      ).toBeInTheDocument();

      mockUseApplicationAttachments.mockReturnValue({
        attachments: [attachmentOne],
      });
      rerender(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={["uuid-1"]}
        />,
      );

      expect(screen.getByText("budget.pdf")).toBeInTheDocument();
      expect(
        screen.queryByText("(Previously uploaded file)"),
      ).not.toBeInTheDocument();
    });

    it("prefers refreshed context metadata for an unchanged attachment id", () => {
      mockUseApplicationAttachments.mockReturnValue({
        attachments: [attachmentOne],
      });
      const { rerender } = render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={["uuid-1"]}
        />,
      );
      expect(screen.getByText("budget.pdf")).toBeInTheDocument();

      // same id, renamed on the server
      mockUseApplicationAttachments.mockReturnValue({
        attachments: [
          buildAttachment("uuid-1", { file_name: "budget-final.pdf" }),
        ],
      });
      rerender(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={["uuid-1"]}
        />,
      );

      expect(screen.getByText("budget-final.pdf")).toBeInTheDocument();
      expect(screen.queryByText("budget.pdf")).not.toBeInTheDocument();
    });
  });

  describe("Parent value changes", () => {
    it("adopts an attachment added by the parent while keeping the existing ones", () => {
      mockUseApplicationAttachments.mockReturnValue({
        attachments: [attachmentOne, attachmentTwo],
      });
      const { container, rerender } = render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={["uuid-1"]}
        />,
      );
      expect(hiddenValue(container)).toEqual(["uuid-1"]);

      rerender(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={["uuid-1", "uuid-2"]}
        />,
      );

      expect(hiddenValue(container)).toEqual(["uuid-1", "uuid-2"]);
      expect(screen.getByText("budget.pdf")).toBeInTheDocument();
      expect(screen.getByText("narrative.pdf")).toBeInTheDocument();
    });

    it("drops an attachment removed by the parent", () => {
      mockUseApplicationAttachments.mockReturnValue({
        attachments: [attachmentOne, attachmentTwo],
      });
      const { container, rerender } = render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={["uuid-1", "uuid-2"]}
        />,
      );

      rerender(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={["uuid-2"]}
        />,
      );

      expect(hiddenValue(container)).toEqual(["uuid-2"]);
      expect(screen.queryByText("budget.pdf")).not.toBeInTheDocument();
      expect(screen.getByText("narrative.pdf")).toBeInTheDocument();
    });

    it("follows a reordered parent value", () => {
      mockUseApplicationAttachments.mockReturnValue({
        attachments: [attachmentOne, attachmentTwo],
      });
      const { container, rerender } = render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={["uuid-1", "uuid-2"]}
        />,
      );

      rerender(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={["uuid-2", "uuid-1"]}
        />,
      );

      expect(hiddenValue(container)).toEqual(["uuid-2", "uuid-1"]);
      expect(screen.getByTestId("file-input-existing-files")).toHaveTextContent(
        /narrative\.pdf[\s\S]*budget\.pdf/,
      );
    });

    it("clears the selection when the parent resets the value", () => {
      mockUseApplicationAttachments.mockReturnValue({
        attachments: [attachmentOne],
      });
      const { container, rerender } = render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={["uuid-1"]}
        />,
      );
      expect(hiddenValue(container)).toEqual(["uuid-1"]);

      rerender(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={undefined}
        />,
      );

      expect(hiddenValue(container)).toEqual([]);
      expect(
        screen.queryByTestId("file-input-existing-files"),
      ).not.toBeInTheDocument();
    });

    it("does not discard a completed upload on an unrelated parent rerender", async () => {
      mockUploadThenCreate([attachmentOne]);
      const { container, rerender } = render(
        <ApplicationMultipleAttachmentWidget {...defaultProps} />,
      );

      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(input, new File(["a"], "budget.pdf"));
      await waitFor(() => expect(hiddenValue(container)).toEqual(["uuid-1"]));

      // parent rerenders with the same (still unsaved) value
      rerender(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={undefined}
        />,
      );

      expect(hiddenValue(container)).toEqual(["uuid-1"]);
    });
  });

  describe("Uploading", () => {
    it("adds one successful attachment to the value", async () => {
      mockUploadThenCreate([attachmentOne]);
      const { container } = render(
        <ApplicationMultipleAttachmentWidget {...defaultProps} />,
      );

      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(input, new File(["a"], "budget.pdf"));

      await waitFor(() => expect(hiddenValue(container)).toEqual(["uuid-1"]));
      expect(clientFetchMock).toHaveBeenCalledWith(
        "/api/applications/app-123/attachments/create",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ pending_file_id: "pending-0" }),
        }),
      );
    });

    it("adds several successful attachments from one selection", async () => {
      mockUploadThenCreate([attachmentOne, attachmentTwo]);
      const { container } = render(
        <ApplicationMultipleAttachmentWidget {...defaultProps} />,
      );

      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(input, [
        new File(["a"], "budget.pdf"),
        new File(["b"], "narrative.pdf"),
      ]);

      await waitFor(() => expect(hiddenValue(container)).toHaveLength(2));
      expect(hiddenValue(container)).toEqual(
        expect.arrayContaining(["uuid-1", "uuid-2"]),
      );
    });

    it("preserves existing saved attachments while new files upload", async () => {
      mockUseApplicationAttachments.mockReturnValue({
        attachments: [attachmentOne],
      });
      mockUploadThenCreate([attachmentTwo]);
      const { container } = render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={["uuid-1"]}
        />,
      );

      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(input, new File(["b"], "narrative.pdf"));

      await waitFor(() =>
        expect(hiddenValue(container)).toEqual(["uuid-1", "uuid-2"]),
      );
      expect(screen.getByText("budget.pdf")).toBeInTheDocument();
    });

    it("keeps successful uploads when another upload fails", async () => {
      // first create succeeds, second rejects
      mockUploadThenCreate([attachmentOne]);
      const { container } = render(
        <ApplicationMultipleAttachmentWidget {...defaultProps} />,
      );

      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(input, [
        new File(["a"], "budget.pdf"),
        new File(["b"], "broken.pdf"),
      ]);

      await waitFor(() => expect(hiddenValue(container)).toEqual(["uuid-1"]));
      // the failed row is dismissible without touching the successful attachment
      const dismissButton = await screen.findByRole("button", {
        name: "dismiss",
      });
      await userEvent.click(dismissButton);
      expect(hiddenValue(container)).toEqual(["uuid-1"]);
    });

    it("does not add a failed upload to the value", async () => {
      clientFetchMock.mockImplementation((url: string) => {
        if (url === "/api/file") {
          return Promise.resolve(
            new Response(
              makeScanStream({ status: "error", error: "scan failed" }),
            ),
          );
        }
        return Promise.reject(new Error("should not be called"));
      });

      const { container } = render(
        <ApplicationMultipleAttachmentWidget {...defaultProps} />,
      );

      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(input, new File(["a"], "bad.pdf"));

      await waitFor(async () =>
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toBeInTheDocument(),
      );
      expect(hiddenValue(container)).toEqual([]);
    });

    it("does not add an infected upload to the value", async () => {
      clientFetchMock.mockImplementation((url: string) => {
        if (url === "/api/file") {
          return Promise.resolve(
            new Response(
              makeScanStream({ status: "pending", error: "file is infected" }),
            ),
          );
        }
        return Promise.reject(new Error("should not be called"));
      });

      const { container } = render(
        <ApplicationMultipleAttachmentWidget {...defaultProps} />,
      );

      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(input, new File(["a"], "infected.pdf"));

      await waitFor(async () =>
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toHaveTextContent("infected"),
      );
      expect(hiddenValue(container)).toEqual([]);
    });

    it("does not add the same attachment twice if the create call resolves repeatedly", async () => {
      // both uploads resolve to the same attachment id
      mockUploadThenCreate([attachmentOne, attachmentOne]);
      const { container } = render(
        <ApplicationMultipleAttachmentWidget {...defaultProps} />,
      );

      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(input, [
        new File(["a"], "budget.pdf"),
        new File(["a"], "budget.pdf"),
      ]);

      await waitFor(() => expect(hiddenValue(container)).toEqual(["uuid-1"]));
      expect(hiddenValue(container)).toHaveLength(1);
    });

    it("marks the form dirty when each upload starts", async () => {
      mockUploadThenCreate([attachmentOne, attachmentTwo]);
      const markFormDirty = jest.fn();
      render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          formContext={{
            widgetSupport: {
              useVirusScanning: false,
              useMultiAttachmentVirusScanning: true,
              markFormDirty,
            },
          }}
        />,
      );

      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(input, [
        new File(["a"], "budget.pdf"),
        new File(["b"], "narrative.pdf"),
      ]);

      expect(markFormDirty).toHaveBeenCalledTimes(2);
    });

    it("shows an independent in-progress status row per file", async () => {
      // a stream that never emits, so both uploads stay in progress and both rows remain
      clientFetchMock.mockImplementation(() =>
        Promise.resolve(new Response(new ReadableStream({ start: () => {} }))),
      );
      render(<ApplicationMultipleAttachmentWidget {...defaultProps} />);

      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(input, [
        new File(["a"], "budget.pdf"),
        new File(["b"], "narrative.pdf"),
      ]);

      const rows = await screen.findAllByTestId("file-upload-status-display");
      expect(rows).toHaveLength(2);
      expect(rows[0]).toHaveTextContent("budget.pdf");
      expect(rows[1]).toHaveTextContent("narrative.pdf");
      // each in-progress row has its own cancel control
      expect(screen.getAllByRole("button", { name: "cancel" })).toHaveLength(2);
    });

    it("cancels one in-progress upload without affecting the other", async () => {
      clientFetchMock.mockImplementation(() =>
        Promise.resolve(new Response(new ReadableStream({ start: () => {} }))),
      );
      render(<ApplicationMultipleAttachmentWidget {...defaultProps} />);

      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(input, [
        new File(["a"], "budget.pdf"),
        new File(["b"], "narrative.pdf"),
      ]);
      expect(
        await screen.findAllByTestId("file-upload-status-display"),
      ).toHaveLength(2);

      await userEvent.click(
        screen.getAllByRole("button", { name: "cancel" })[0],
      );

      const remaining = await screen.findAllByTestId(
        "file-upload-status-display",
      );
      expect(remaining).toHaveLength(1);
      expect(remaining[0]).toHaveTextContent("narrative.pdf");
    });

    it("does not add a canceled upload to the value", async () => {
      clientFetchMock.mockImplementation(() =>
        Promise.resolve(new Response(new ReadableStream({ start: () => {} }))),
      );
      const { container } = render(
        <ApplicationMultipleAttachmentWidget {...defaultProps} />,
      );

      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(input, new File(["a"], "budget.pdf"));
      await userEvent.click(screen.getByRole("button", { name: "cancel" }));

      expect(hiddenValue(container)).toEqual([]);
    });
  });

  describe("Deletion", () => {
    const renderWithTwoSaved = (markFormDirty = jest.fn()) => {
      mockUseApplicationAttachments.mockReturnValue({
        attachments: [attachmentOne, attachmentTwo],
      });
      return render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={["uuid-1", "uuid-2"]}
          formContext={{
            widgetSupport: {
              useVirusScanning: false,
              useMultiAttachmentVirusScanning: true,
              markFormDirty,
            },
          }}
        />,
      );
    };

    it("deletes one attachment without removing the others", async () => {
      const { container } = renderWithTwoSaved();

      const rows = screen.getByTestId("file-input-existing-files");
      const deleteButtons = within(rows).getAllByRole("button", {
        name: "delete",
      });
      expect(deleteButtons).toHaveLength(2);

      await userEvent.click(deleteButtons[0]);
      await userEvent.click(
        screen.getByRole("button", { name: "deleteFileCta" }),
      );

      await waitFor(() => expect(hiddenValue(container)).toEqual(["uuid-2"]));
      expect(screen.getByText("narrative.pdf")).toBeInTheDocument();
      expect(screen.queryByText("budget.pdf")).not.toBeInTheDocument();
    });

    it("marks the form dirty on deletion", async () => {
      const markFormDirty = jest.fn();
      renderWithTwoSaved(markFormDirty);

      const rows = screen.getByTestId("file-input-existing-files");
      await userEvent.click(
        within(rows).getAllByRole("button", { name: "delete" })[0],
      );
      await userEvent.click(
        screen.getByRole("button", { name: "deleteFileCta" }),
      );

      await waitFor(() => expect(markFormDirty).toHaveBeenCalled());
    });

    it("does not call the delete attachment API - removal is persisted on save", async () => {
      renderWithTwoSaved();

      const rows = screen.getByTestId("file-input-existing-files");
      await userEvent.click(
        within(rows).getAllByRole("button", { name: "delete" })[0],
      );
      await userEvent.click(
        screen.getByRole("button", { name: "deleteFileCta" }),
      );

      await waitFor(() =>
        expect(screen.queryByText("budget.pdf")).not.toBeInTheDocument(),
      );
      expect(clientFetchMock).not.toHaveBeenCalled();
    });
  });

  describe("Locked and read only fields", () => {
    const renderNonEditable = (overrides: Partial<UswdsWidgetProps>) => {
      mockUseApplicationAttachments.mockReturnValue({
        attachments: [attachmentOne],
      });
      render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={["uuid-1"]}
          {...overrides}
        />,
      );
    };

    it("disables the file chooser when the form is locked", async () => {
      renderNonEditable({ disabled: true });
      expect(await screen.findByTestId("file-input-input")).toBeDisabled();
    });

    it("disables the file chooser when read only", async () => {
      renderNonEditable({ readOnly: true });
      expect(await screen.findByTestId("file-input-input")).toBeDisabled();
    });

    // SimplerFileInput renders the delete control disabled rather than omitting it, so
    // the file stays listed but deletion cannot be triggered by pointer or keyboard.
    it("disables the delete control when the form is locked", () => {
      renderNonEditable({ disabled: true });
      expect(screen.getByText("budget.pdf")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "delete" })).toBeDisabled();
    });

    it("disables the delete control when read only", () => {
      renderNonEditable({ readOnly: true });
      expect(screen.getByRole("button", { name: "delete" })).toBeDisabled();
    });

    it("does not render the delete confirmation when the form is locked", () => {
      renderNonEditable({ disabled: true });
      expect(
        screen.queryByRole("button", { name: "deleteFileCta" }),
      ).not.toBeInTheDocument();
    });

    it("still submits the saved attachment ids when the form is locked", () => {
      mockUseApplicationAttachments.mockReturnValue({
        attachments: [attachmentOne],
      });
      const { container } = render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          value={["uuid-1"]}
          disabled={true}
        />,
      );
      expect(hiddenValue(container)).toEqual(["uuid-1"]);
    });
  });

  describe("Labelling and validation", () => {
    it("renders the field title and associates it with the visible input", () => {
      render(<ApplicationMultipleAttachmentWidget {...defaultProps} />);

      expect(screen.getByText("Additional Project Title")).toBeInTheDocument();
    });

    it("shows the required indicator when the field is required", () => {
      render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          required={true}
        />,
      );

      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("does not set native required on the chooser once an attachment exists", async () => {
      mockUseApplicationAttachments.mockReturnValue({
        attachments: [attachmentOne],
      });
      render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          required={true}
          value={["uuid-1"]}
        />,
      );

      // the chooser is always empty, so leaving it required would block submission
      expect(await screen.findByTestId("file-input-input")).not.toBeRequired();
    });

    it("sets native required on the chooser when required and nothing is attached", async () => {
      render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          required={true}
        />,
      );

      expect(await screen.findByTestId("file-input-input")).toBeRequired();
    });

    it("clears native required once an upload succeeds", async () => {
      mockUploadThenCreate([attachmentOne]);
      const { container } = render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          required={true}
        />,
      );

      const input = await screen.findByTestId("file-input-input");
      expect(input).toBeRequired();

      await userEvent.upload(input, new File(["a"], "budget.pdf"));

      await waitFor(() => expect(hiddenValue(container)).toEqual(["uuid-1"]));
      expect(input).not.toBeRequired();
    });

    it("stays required while an upload is only in progress", async () => {
      // a stream that never emits, so the upload never reaches success
      clientFetchMock.mockImplementation(() =>
        Promise.resolve(new Response(new ReadableStream({ start: () => {} }))),
      );
      const { container } = render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          required={true}
        />,
      );

      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(input, new File(["a"], "budget.pdf"));

      expect(
        await screen.findByTestId("file-upload-status-display"),
      ).toBeInTheDocument();
      expect(hiddenValue(container)).toEqual([]);
      expect(input).toBeRequired();
    });

    it("stays required after a failed upload", async () => {
      clientFetchMock.mockImplementation((url: string) => {
        if (url === "/api/file") {
          return Promise.resolve(
            new Response(
              makeScanStream({ status: "error", error: "scan failed" }),
            ),
          );
        }
        return Promise.reject(new Error("should not be called"));
      });
      render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          required={true}
        />,
      );

      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(input, new File(["a"], "bad.pdf"));

      await waitFor(async () =>
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toBeInTheDocument(),
      );
      expect(input).toBeRequired();
    });

    it("stays required after a canceled upload", async () => {
      clientFetchMock.mockImplementation(() =>
        Promise.resolve(new Response(new ReadableStream({ start: () => {} }))),
      );
      render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          required={true}
        />,
      );

      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(input, new File(["a"], "budget.pdf"));
      await userEvent.click(screen.getByRole("button", { name: "cancel" }));

      expect(input).toBeRequired();
    });

    it("becomes required again when the last attachment is deleted", async () => {
      mockUseApplicationAttachments.mockReturnValue({
        attachments: [attachmentOne],
      });
      const { container } = render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          required={true}
          value={["uuid-1"]}
        />,
      );

      const input = await screen.findByTestId("file-input-input");
      expect(input).not.toBeRequired();

      const rows = screen.getByTestId("file-input-existing-files");
      await userEvent.click(
        within(rows).getAllByRole("button", { name: "delete" })[0],
      );
      await userEvent.click(
        screen.getByRole("button", { name: "deleteFileCta" }),
      );

      await waitFor(() => expect(hiddenValue(container)).toEqual([]));
      expect(input).toBeRequired();
    });

    it("renders the validation error and marks the input invalid", async () => {
      render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          rawErrors={["This field is required"]}
        />,
      );

      const error = screen.getByText("This field is required");
      expect(error).toBeInTheDocument();

      const input = await screen.findByTestId("file-input-input");
      expect(input).toHaveAttribute("aria-invalid", "true");
      // aria-describedby must reference both the label and the rendered error element
      expect(input).toHaveAttribute(
        "aria-describedby",
        "label-for-additional_project_title-visible error-for-additional_project_title-visible",
      );
      expect(
        // eslint-disable-next-line testing-library/no-node-access
        document.getElementById("error-for-additional_project_title-visible"),
      ).toHaveTextContent("This field is required");
    });

    it("marks the input valid once the validation error clears", async () => {
      const { rerender } = render(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          rawErrors={["This field is required"]}
        />,
      );
      expect(await screen.findByTestId("file-input-input")).toHaveAttribute(
        "aria-invalid",
        "true",
      );

      rerender(
        <ApplicationMultipleAttachmentWidget
          {...defaultProps}
          rawErrors={[]}
        />,
      );

      expect(await screen.findByTestId("file-input-input")).toHaveAttribute(
        "aria-invalid",
        "false",
      );
    });

    it("describes the input by the label alone when there is no error", async () => {
      render(<ApplicationMultipleAttachmentWidget {...defaultProps} />);

      expect(await screen.findByTestId("file-input-input")).toHaveAttribute(
        "aria-describedby",
        "label-for-additional_project_title-visible",
      );
    });

    it("keeps the hidden form input and the visible chooser on distinct ids", async () => {
      const { container } = render(
        <ApplicationMultipleAttachmentWidget {...defaultProps} />,
      );

      expect(getHiddenInput(container)).toHaveAttribute(
        "id",
        "additional_project_title",
      );
      expect(await screen.findByTestId("file-input-input")).toHaveAttribute(
        "id",
        "additional_project_title-visible",
      );
    });
  });
});
