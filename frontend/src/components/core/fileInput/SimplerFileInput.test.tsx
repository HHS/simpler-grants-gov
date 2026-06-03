/**
 * @jest-environment ./src/utils/testing/jsdomNodeEnvironment.ts
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { wait } from "@testing-library/user-event/dist/cjs/utils/index.js";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { SimplerFileInput } from "./SimplerFileInput";

const clientFetchMock = jest.fn();

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: unknown[]) => clientFetchMock(...args) as unknown,
  }),
}));

// this allows us to advance the response stream manually from within the tests
const createAdvanceStreamTrigger = () => {
  let handler: () => void;
  return {
    listen(fn: () => void) {
      handler = fn;
    },
    advance() {
      handler();
    },
  };
};

const makeStream = (
  chunks: string[],
  trigger: {
    listen: (fn: () => void) => void;
    advance: () => void;
  },
) => {
  let chunkIndex = 0;
  const maxChunks = chunks.length;
  return new ReadableStream({
    start: (controller) => {
      trigger.listen(() => {
        if (chunkIndex === maxChunks) {
          controller.close();
          return;
        }
        const chunk = chunks[chunkIndex];
        if (chunk === "error") {
          controller.error(new Error());
          return;
        }
        controller.enqueue(chunk);
        chunkIndex++;
      });
    },
  });
};

describe("SimplerFileInput", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  describe("Status display", () => {
    it("does not display a custom progress indicator when no files have been uploaded", async () => {
      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          postUploadAction={() => Promise.resolve(undefined)}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
        />,
      );
      expect(
        screen.queryByTestId("file-upload-status-display"),
      ).not.toBeInTheDocument();
    });
    it("displays a custom progress indicator during upload", async () => {
      clientFetchMock.mockResolvedValue(new Response());
      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          postUploadAction={() => Promise.resolve(undefined)}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
        />,
      );
      // this id looks wrong but that's what Trussworks called it
      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(
        input,
        new File(["test content"], "test.txt", {
          type: "text/plain",
        }),
      );
      expect(
        await screen.findByTestId("file-upload-status-display"),
      ).toBeInTheDocument();
    });
    it("displays a 'queued' message when queued", async () => {
      const trigger = createAdvanceStreamTrigger();
      clientFetchMock.mockResolvedValue(
        new Response(makeStream(["uploading", "scanning"], trigger)),
      );
      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          postUploadAction={() => Promise.resolve(undefined)}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
        />,
      );
      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(
        input,
        new File(["test content"], "test.txt", {
          type: "text/plain",
        }),
      );
      expect(
        await screen.findByTestId("file-upload-status-display"),
      ).toHaveTextContent("queued");
    });

    it("displays a sequential status messages as received from streaming response", async () => {
      const trigger = createAdvanceStreamTrigger();
      clientFetchMock.mockResolvedValue(
        new Response(makeStream(["uploading", "scanning"], trigger)),
      );
      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          postUploadAction={() => Promise.resolve(undefined)}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
        />,
      );
      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(
        input,
        new File(["test content"], "test.txt", {
          type: "text/plain",
        }),
      );
      trigger.advance();
      await waitFor(async () =>
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toHaveTextContent("uploading"),
      );

      trigger.advance();
      await waitFor(async () =>
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toHaveTextContent("scanning"),
      );
    });

    it("displays post upload status after successful upload", async () => {
      const trigger = createAdvanceStreamTrigger();
      // we're not concerned with the upload process here, so no need to mess with stream states
      clientFetchMock.mockResolvedValue(new Response(makeStream([], trigger)));
      const delayedPostUploadAction = (): Promise<undefined> => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(undefined), 10);
        });
      };
      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          postUploadAction={delayedPostUploadAction}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
        />,
      );
      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(
        input,
        new File(["test content"], "test.txt", {
          type: "text/plain",
        }),
      );
      trigger.advance();
      await waitFor(async () =>
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toHaveTextContent("post upload action in progress"),
      );
    });

    it("displays complete status after successful post-upload", async () => {
      const trigger = createAdvanceStreamTrigger();
      clientFetchMock.mockResolvedValue(new Response(makeStream([], trigger)));
      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          postUploadAction={() => Promise.resolve(undefined)}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
        />,
      );
      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(
        input,
        new File(["test content"], "test.txt", {
          type: "text/plain",
        }),
      );
      trigger.advance();
      await waitFor(async () =>
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toHaveTextContent("post upload action success"),
      );
    });

    it("displays a generic error if error occurs outside of upload process", async () => {
      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          onStart={() => {
            throw new Error();
          }}
          postUploadAction={() => Promise.resolve(undefined)}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
        />,
      );
      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(
        input,
        new File(["test content"], "test.txt", {
          type: "text/plain",
        }),
      );
      await waitFor(async () =>
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toHaveTextContent("error"),
      );
    });

    it("displays an upload error if error occurs during upload process", async () => {
      const trigger = createAdvanceStreamTrigger();
      clientFetchMock.mockResolvedValue(
        new Response(makeStream(["uploading", "error"], trigger)),
      );
      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          postUploadAction={() => Promise.resolve(undefined)}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
        />,
      );
      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(
        input,
        new File(["test content"], "test.txt", {
          type: "text/plain",
        }),
      );
      trigger.advance();
      // this needs to be here to allow the "uploading" state to take effect
      await new Promise((resolve) => setTimeout(resolve, 10));
      trigger.advance();
      await waitFor(async () =>
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toHaveTextContent("uploadError"),
      );
    });

    it("displays an scan error if error occurs during scan process", async () => {
      const trigger = createAdvanceStreamTrigger();
      clientFetchMock.mockResolvedValue(
        new Response(makeStream(["uploading", "scanning", "error"], trigger)),
      );
      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          postUploadAction={() => Promise.resolve(undefined)}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
        />,
      );
      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(
        input,
        new File(["test content"], "test.txt", {
          type: "text/plain",
        }),
      );
      trigger.advance();
      await new Promise((resolve) => setTimeout(resolve, 10));
      trigger.advance();
      await new Promise((resolve) => setTimeout(resolve, 10));
      trigger.advance();
      await waitFor(async () =>
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toHaveTextContent("scanError"),
      );
    });

    it("displays a post-upload error if error occurs during post-upload process", async () => {
      const trigger = createAdvanceStreamTrigger();
      // we're not concerned with the upload process here, so no need to mess with stream states
      clientFetchMock.mockResolvedValue(new Response(makeStream([], trigger)));
      const delayedPostUploadAction = (): Promise<undefined> => {
        return new Promise((_resolve, reject) => {
          setTimeout(() => reject(new Error()), 10);
        });
      };
      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          postUploadAction={delayedPostUploadAction}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
        />,
      );
      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(
        input,
        new File(["test content"], "test.txt", {
          type: "text/plain",
        }),
      );
      trigger.advance();
      await waitFor(async () =>
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toHaveTextContent("post upload action error"),
      );
    });
  });
  describe("Callbacks", () => {
    it("calls onStart callback as expected when upload starts", async () => {
      clientFetchMock.mockResolvedValue(new Response());
      const mockOnStart = jest.fn();
      render(
        <SimplerFileInput
          onStart={mockOnStart}
          onDelete={() => Promise.resolve()}
          postUploadAction={() => Promise.resolve(undefined)}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
        />,
      );
      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(
        input,
        new File(["test content"], "test.txt", {
          type: "text/plain",
        }),
      );
      expect(mockOnStart).toHaveBeenCalled();
    });
    it("calls postUploadAction on completed upload", async () => {
      const trigger = createAdvanceStreamTrigger();
      // we're not concerned with the upload process here, so no need to mess with stream states
      clientFetchMock.mockResolvedValue(new Response(makeStream([], trigger)));
      const mockPostUploadAction = jest.fn();
      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          postUploadAction={mockPostUploadAction}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
        />,
      );
      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(
        input,
        new File(["test content"], "test.txt", {
          type: "text/plain",
        }),
      );
      trigger.advance();
      await waitFor(() => expect(mockPostUploadAction).toHaveBeenCalled());
    });

    it("calls onSuccess with expected argument on completed post upload action", async () => {
      const trigger = createAdvanceStreamTrigger();
      // we're not concerned with the upload process here, so no need to mess with stream states
      clientFetchMock.mockResolvedValue(new Response(makeStream([], trigger)));
      const mockOnSuccess = jest.fn();
      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          onSuccess={mockOnSuccess}
          postUploadAction={() => Promise.resolve("arbitrary return value")}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
        />,
      );
      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(
        input,
        new File(["test content"], "test.txt", {
          type: "text/plain",
        }),
      );
      trigger.advance();
      await waitFor(() =>
        expect(mockOnSuccess).toHaveBeenCalledWith("arbitrary return value"),
      );
    });
    it("calls onError callback on error", async () => {
      const mockOnError = jest.fn();
      const fakeError = new Error();
      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          onStart={() => {
            throw fakeError;
          }}
          onError={mockOnError}
          postUploadAction={() => Promise.resolve(undefined)}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
        />,
      );
      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(
        input,
        new File(["test content"], "test.txt", {
          type: "text/plain",
        }),
      );
      await waitFor(() => expect(mockOnError).toHaveBeenCalledWith(fakeError));
    });
  });
  describe("User Interface", () => {
    it("does not display the Trussworks file preview", async () => {
      const trigger = createAdvanceStreamTrigger();
      clientFetchMock.mockResolvedValue(new Response(makeStream([], trigger)));
      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          postUploadAction={() => Promise.resolve(undefined)}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
        />,
      );
      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(
        input,
        new File(["test content"], "test.txt", {
          type: "text/plain",
        }),
      );
      screen.debug();
      const trussworksPreviewImages = screen.queryByTestId(
        "file-input-preview-image",
      );
      const trussworksPreviews = screen.queryByTestId("file-input-preview");
      // aria-hidden seems to be the way to do this for testing, but is that possible?
      // or do we just remove it? use mutation observer? not worry about testing, and rely on the css?
      expect(trussworksPreviewImages).not.toBeVisible();
      expect(trussworksPreviews).not.toBeVisible();
    });
  });
});
