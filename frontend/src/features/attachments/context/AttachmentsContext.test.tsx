/* eslint-disable import/first */
jest.mock("src/features/attachments/hooks/useAttachmentRefresh");

/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { act, render, screen } from "@testing-library/react";
import { useAttachmentRefresh as mockUseAttachmentRefresh } from "src/features/attachments/hooks/useAttachmentRefresh";
import { Attachment } from "src/types/attachmentTypes";

import { useRouter } from "next/navigation";
import React from "react";

import {
  AttachmentsProvider,
  useAttachmentsContext,
} from "./AttachmentsContext";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockRouterRefresh = jest.fn();
const mockRefreshAttachments = jest.fn();

beforeAll(() => {
  global.crypto = {
    ...global.crypto,
    randomUUID: jest.fn(() => "123e4567-e89b-12d3-a456-426614174000"),
  } as Crypto;
});

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ refresh: mockRouterRefresh });
  (mockUseAttachmentRefresh as jest.Mock).mockReturnValue(
    mockRefreshAttachments,
  );
});

const testAttachment: Attachment = {
  application_attachment_id: "123",
  file_name: "example.pdf",
  file_size_bytes: 1024,
  mime_type: "application/pdf",
  download_path: "/fake/path",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  status: "completed",
};

const TestComponent = () => {
  const ctx = useAttachmentsContext();

  return (
    <div>
      <div data-testid="attachment-count">{ctx.attachments.length}</div>
      <button
        onClick={() => ctx.setPendingDeleteId("123")}
        data-testid="set-delete"
      >
        Set Delete ID
      </button>
      <div data-testid="delete-id">{ctx.pendingDeleteId}</div>
    </div>
  );
};

const setup = (attachments = [testAttachment]) =>
  render(
    <AttachmentsProvider
      applicationId="app-001"
      initialAttachments={attachments}
    >
      <TestComponent />
    </AttachmentsProvider>,
  );

describe("AttachmentsProvider", () => {
  it("provides initial attachments and state", () => {
    setup();
    expect(screen.getByTestId("attachment-count").textContent).toBe("1");
  });

  it("updates pendingDeleteId correctly", () => {
    setup();
    act(() => {
      screen.getByTestId("set-delete").click();
    });
    expect(screen.getByTestId("delete-id").textContent).toBe("123");
  });

  it("addUploading adds a temporary attachment with uploading status", () => {
    let context: ReturnType<typeof useAttachmentsContext> | undefined;

    const HookConsumer = () => {
      context = useAttachmentsContext();
      return null;
    };

    render(
      <AttachmentsProvider applicationId="app-001" initialAttachments={[]}>
        <HookConsumer />
      </AttachmentsProvider>,
    );

    const file = new File(["abc"], "file.txt", { type: "text/plain" });
    const controller = new AbortController();

    act(() => {
      context!.addUploading(file, controller);
    });

    expect(context!.attachments[0]).toMatchObject({
      file_name: "file.txt",
      file_size_bytes: 3,
      status: "uploading",
    });
  });

  it("remove deletes an attachment by id", () => {
    let context: ReturnType<typeof useAttachmentsContext> | undefined;

    const HookConsumer = () => {
      context = useAttachmentsContext();
      return null;
    };

    render(
      <AttachmentsProvider
        applicationId="app-001"
        initialAttachments={[testAttachment]}
      >
        <HookConsumer />
      </AttachmentsProvider>,
    );

    expect(context!.attachments.length).toBe(1);

    act(() => {
      context!.remove("123");
    });

    expect(context!.attachments.length).toBe(0);
  });

  it("updateStatus modifies an attachment status", () => {
    let context: ReturnType<typeof useAttachmentsContext> | undefined;

    const HookConsumer = () => {
      context = useAttachmentsContext();
      return null;
    };

    render(
      <AttachmentsProvider
        applicationId="app-001"
        initialAttachments={[testAttachment]}
      >
        <HookConsumer />
      </AttachmentsProvider>,
    );

    act(() => {
      context!.updateStatus("123", "failed");
    });

    expect(context!.attachments[0].status).toBe("failed");
  });

  it("refresh calls internal refresh logic and router.refresh", async () => {
    let context: ReturnType<typeof useAttachmentsContext> | undefined;

    const HookConsumer = () => {
      context = useAttachmentsContext();
      return null;
    };

    render(
      <AttachmentsProvider applicationId="app-001" initialAttachments={[]}>
        <HookConsumer />
      </AttachmentsProvider>,
    );

    await act(async () => {
      await context!.refresh();
    });

    expect(mockRefreshAttachments).toHaveBeenCalled();
    expect(mockRouterRefresh).toHaveBeenCalled();
  });

  it("throws error if context is used outside of provider", () => {
    const ConsoleSpy = jest.spyOn(console, "error").mockImplementation();
    const BadConsumer = () => {
      useAttachmentsContext();
      return null;
    };
    expect(() => render(<BadConsumer />)).toThrowError(
      /useAttachmentsContext must be used within AttachmentsProvider/,
    );
    ConsoleSpy.mockRestore();
  });
});
