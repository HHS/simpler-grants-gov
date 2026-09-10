import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import {
  PostUploadAction,
  UploadFileMetadata,
} from "src/types/fileUploadTypes";
import { OpportunityAttachment } from "src/types/opportunity/opportunityAttachmentTypes";

import { OpportunityAttachmentUploadInput } from "./OpportunityAttachmentUploadInput";

type MockSimplerFileInputProps = {
  id: string;
  multiFile?: boolean;
  postUploadAction: PostUploadAction;
  onDelete: (fileId: string) => Promise<unknown>;
  existingFiles?: UploadFileMetadata[];
};

const mockSimplerFileInput = jest.fn();

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// the metadata fetch inside postUploadAction goes through useClientFetch
const clientFetchMock = jest.fn();
jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: unknown[]) => clientFetchMock(...args) as unknown,
  }),
}));

jest.mock("src/components/core/fileInput/SimplerFileInput", () => ({
  SimplerFileInput: (props: MockSimplerFileInputProps) => {
    mockSimplerFileInput(props);
    return (
      <>
        <button
          type="button"
          onClick={() => {
            // real callers (useFileUpload.ts) always attach a .catch() - mirror that
            // here so a rejected postUploadAction doesn't surface as an unhandled
            // rejection in tests that exercise the failure path
            props
              .postUploadAction("pending-1", new AbortController().signal)
              .catch(() => {});
          }}
        >
          upload
        </button>
        <button
          type="button"
          onClick={() => {
            void props.onDelete("pending-1");
          }}
        >
          delete-held
        </button>
        <button
          type="button"
          onClick={() => {
            void props.onDelete("existing-1");
          }}
        >
          delete-existing
        </button>
      </>
    );
  },
}));

const getHiddenInputValue = (container: HTMLElement, name: string) =>
  // eslint-disable-next-line testing-library/no-node-access
  container.querySelector<HTMLInputElement>(
    `input[type="hidden"][name="${name}"]`,
  )?.value;

const existingAttachment: OpportunityAttachment = {
  opportunity_attachment_id: "existing-1",
  file_name: "already-saved.pdf",
  mime_type: "application/pdf",
  file_size: 2048,
  created_at: "2024-01-01T00:00:00.000Z",
};

describe("OpportunityAttachmentUploadInput", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("passes multiFile and the mapped initial attachments through to SimplerFileInput", () => {
    render(
      <OpportunityAttachmentUploadInput
        initialAttachments={[existingAttachment]}
      />,
    );

    expect(mockSimplerFileInput).toHaveBeenCalledWith(
      expect.objectContaining({
        multiFile: true,
        existingFiles: [
          {
            id: "existing-1",
            fileName: "already-saved.pdf",
            fileSize: 2048,
            mimeType: "application/pdf",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        ],
      }),
    );
  });

  it("renders empty held/deleted hidden fields when there are no initial attachments", () => {
    const { container } = render(<OpportunityAttachmentUploadInput />);

    expect(getHiddenInputValue(container, "held_pending_file_ids")).toBe("[]");
    expect(getHiddenInputValue(container, "deleted_attachment_ids")).toBe("[]");
  });

  it("holds a file locally after upload, without calling any create-attachment fetcher", async () => {
    clientFetchMock.mockResolvedValue({
      file_metadata: { file_name: "budget.pdf", file_size_bytes: 4096 },
    });

    const { container } = render(<OpportunityAttachmentUploadInput />);

    fireEvent.click(screen.getByRole("button", { name: "upload" }));

    await waitFor(() =>
      expect(getHiddenInputValue(container, "held_pending_file_ids")).toBe(
        JSON.stringify(["pending-1"]),
      ),
    );

    // the only network call postUploadAction makes is the metadata fetch - there is no
    // create-attachment call on this client path, per the Save-gated design
    expect(clientFetchMock).toHaveBeenCalledTimes(1);
    expect(clientFetchMock).toHaveBeenCalledWith(
      "/api/file/pending-1/results-metadata",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("removes a held file locally on delete, calling no fetcher at all", async () => {
    clientFetchMock.mockResolvedValue({
      file_metadata: { file_name: "budget.pdf", file_size_bytes: 4096 },
    });

    const { container } = render(<OpportunityAttachmentUploadInput />);

    fireEvent.click(screen.getByRole("button", { name: "upload" }));
    await waitFor(() =>
      expect(getHiddenInputValue(container, "held_pending_file_ids")).toBe(
        JSON.stringify(["pending-1"]),
      ),
    );
    clientFetchMock.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "delete-held" }));

    expect(getHiddenInputValue(container, "held_pending_file_ids")).toBe("[]");
    expect(getHiddenInputValue(container, "deleted_attachment_ids")).toBe("[]");
    expect(clientFetchMock).not.toHaveBeenCalled();
    // the deleted file must also disappear from what's actually rendered, not just
    // from the hidden field
    expect(mockSimplerFileInput).toHaveBeenLastCalledWith(
      expect.objectContaining({ existingFiles: [] }),
    );
  });

  it("marks an already-saved file for deletion locally, calling no delete fetcher", () => {
    const { container } = render(
      <OpportunityAttachmentUploadInput
        initialAttachments={[existingAttachment]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "delete-existing" }));

    expect(getHiddenInputValue(container, "deleted_attachment_ids")).toBe(
      JSON.stringify(["existing-1"]),
    );
    expect(clientFetchMock).not.toHaveBeenCalled();
    // the deleted file must also disappear from what's actually rendered, not just
    // from the hidden field
    expect(mockSimplerFileInput).toHaveBeenLastCalledWith(
      expect.objectContaining({ existingFiles: [] }),
    );
  });

  it("does not hold a file locally when the metadata fetch fails", async () => {
    clientFetchMock.mockRejectedValue(
      new Error("Error fetching uploaded file metadata: 409"),
    );

    const { container } = render(<OpportunityAttachmentUploadInput />);

    fireEvent.click(screen.getByRole("button", { name: "upload" }));

    await waitFor(() => expect(clientFetchMock).toHaveBeenCalledTimes(1));

    expect(getHiddenInputValue(container, "held_pending_file_ids")).toBe("[]");
    expect(mockSimplerFileInput).toHaveBeenLastCalledWith(
      expect.objectContaining({ existingFiles: [] }),
    );
  });

  describe("accessibility", () => {
    it("passes accessibility scan when rendered", async () => {
      const { container } = render(
        <OpportunityAttachmentUploadInput
          initialAttachments={[existingAttachment]}
        />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
