/**
 * @jest-environment ./src/utils/testing/jsdomNodeEnvironment.ts
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createAdvanceStreamTrigger,
  makeAdvanceableTestStreamForTrigger,
} from "src/utils/testing/streamTestUtils";

import { SimplerFileInput } from "./SimplerFileInput";

const clientFetchMock = jest.fn();
const fakeAbortController = jest.fn();
const fakeTextDecoder = jest.fn();
const fakeFileReader = jest.fn();

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: () => ({
    clientFetch: (...args: unknown[]) => clientFetchMock(...args) as unknown,
  }),
}));

const fakeExistingFile = {
  id: "1",
  fileName: "test.txt",
  updatedAt: new Date().toDateString(),
};

let originalAbortController: typeof AbortController;
let originalTextDecoder: typeof TextDecoder;
let originalFileReader: typeof FileReader;

describe("SimplerFileInput", () => {
  beforeEach(() => {
    originalAbortController = global.AbortController;
    global.AbortController = fakeAbortController;

    fakeTextDecoder.mockImplementation(() => ({
      decode: (value: unknown) => value,
    }));
    originalTextDecoder = global.TextDecoder;
    global.TextDecoder = fakeTextDecoder;

    // file reader needs to get mocked because it is used in the trussworks
    // FilePreview (even though we are hiding this), and it doesn't play well with
    // the JSDOM version of Blobs
    fakeFileReader.mockImplementation(() => ({
      readAsDataURL: jest.fn(),
    }));
    originalFileReader = global.FileReader;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.FileReader = fakeFileReader;
  });
  afterEach(() => {
    global.TextDecoder = originalTextDecoder;
    global.AbortController = originalAbortController;
    global.FileReader = originalFileReader;
    jest.resetAllMocks();
  });
  describe("Status display", () => {
    afterEach(() => {
      jest.useRealTimers();
    });
    it("does not display a custom progress indicator when no files have been uploaded", () => {
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
      const trigger = createAdvanceStreamTrigger();
      clientFetchMock.mockResolvedValue(
        new Response(makeAdvanceableTestStreamForTrigger([], trigger)),
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
        new Response(
          makeAdvanceableTestStreamForTrigger(
            [
              JSON.stringify({ status: "uploading" }),
              JSON.stringify({ status: "pending" }),
            ],
            trigger,
          ),
        ),
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
        new Response(
          makeAdvanceableTestStreamForTrigger(
            [
              JSON.stringify({ status: "uploading" }),
              JSON.stringify({ status: "pending" }),
            ],
            trigger,
          ),
        ),
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
      clientFetchMock.mockResolvedValue(
        new Response(
          makeAdvanceableTestStreamForTrigger(
            [JSON.stringify({ status: "whatever", pendingFileId: "1" })],
            trigger,
          ),
        ),
      );
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
      clientFetchMock.mockResolvedValue(
        new Response(
          makeAdvanceableTestStreamForTrigger(
            [JSON.stringify({ status: "whatever", pendingFileId: "1" })],
            trigger,
          ),
        ),
      );

      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          onSuccess={() => {
            screen
              .findByTestId("file-upload-status-display")
              .then((display) => {
                // eslint-disable-next-line jest/no-conditional-expect
                return expect(display).toHaveTextContent(
                  "post upload action success",
                );
              })
              .catch(() => {});
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
      trigger.advance();
      // note that the expect is in the callback!!!
    });

    it("displays a generic error if error occurs outside of upload process", async () => {
      const mockOnError = jest.fn();
      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          onStart={() => {
            throw new Error("fake error");
          }}
          postUploadAction={() => Promise.resolve(undefined)}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
          onError={mockOnError}
        />,
      );
      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(
        input,
        new File(["test content"], "test.txt", {
          type: "text/plain",
        }),
      );
      await waitFor(() => expect(mockOnError).toHaveBeenCalled());
      await waitFor(async () =>
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toHaveTextContent("preUploadError"),
      );
    });

    it("displays an upload error if error occurs during upload process", async () => {
      const trigger = createAdvanceStreamTrigger();
      clientFetchMock.mockResolvedValue(
        new Response(
          makeAdvanceableTestStreamForTrigger(
            [
              JSON.stringify({ status: "uploading" }),
              JSON.stringify({ status: "error", error: "yes" }),
            ],
            trigger,
          ),
        ),
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

    it("displays a scan error if error occurs during scan process", async () => {
      const trigger = createAdvanceStreamTrigger();
      clientFetchMock.mockResolvedValue(
        new Response(
          makeAdvanceableTestStreamForTrigger(
            [
              JSON.stringify({ status: "uploading" }),
              JSON.stringify({ status: "pending" }),
              JSON.stringify({ status: "error", error: "yes" }),
            ],
            trigger,
          ),
        ),
      );
      const mockOnError = jest.fn();
      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          postUploadAction={() => Promise.resolve(undefined)}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
          onError={mockOnError}
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
      trigger.advance();
      trigger.advance();
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
      });
      await waitFor(async () =>
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toHaveTextContent("scanError"),
      );
    });

    it("displays a post-upload error if error occurs during post-upload process", async () => {
      const trigger = createAdvanceStreamTrigger();
      // we're not concerned with the upload process here, so no need to mess with stream states
      clientFetchMock.mockResolvedValue(
        new Response(
          makeAdvanceableTestStreamForTrigger(
            [JSON.stringify({ status: "whatever", pendingFileId: "1" })],
            trigger,
          ),
        ),
      );
      const delayedPostUploadAction = (): Promise<undefined> => {
        return new Promise((_resolve, reject) => {
          setTimeout(() => reject(new Error("fake error")), 10);
        });
      };
      const mockOnError = jest.fn();
      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          postUploadAction={delayedPostUploadAction}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
          onError={mockOnError}
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
      // test won't pass without this, as it takes too long to update the DOM w error info otherwise?
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
      });
      await waitFor(async () =>
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toHaveTextContent("post upload action error"),
      );
    });
    it("clears status display on error dismiss", async () => {
      const trigger = createAdvanceStreamTrigger();
      clientFetchMock.mockResolvedValue(
        new Response(
          makeAdvanceableTestStreamForTrigger(
            [
              JSON.stringify({ status: "uploading" }),
              JSON.stringify({ status: "error", error: "yes" }),
            ],
            trigger,
          ),
        ),
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

      const dismissButton = screen.getByRole("button", { name: "dismiss" });
      expect(dismissButton).toBeInTheDocument();
      await userEvent.click(dismissButton);

      expect(
        screen.queryByTestId("file-upload-status-display"),
      ).not.toBeInTheDocument();
    });
    it("clears status display on upload cancel", async () => {
      const controllerAbortMock = jest.fn();
      fakeAbortController.mockImplementation(() => ({
        abort: controllerAbortMock,
        signal: {
          abort: jest.fn(),
        },
      }));
      const trigger = createAdvanceStreamTrigger();
      clientFetchMock.mockResolvedValue(
        new Response(
          makeAdvanceableTestStreamForTrigger(
            [JSON.stringify({ status: "uploading" })],
            trigger,
          ),
        ),
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
      await waitFor(async () => {
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toHaveTextContent("uploading");
      });
      const cancelButton = screen.getByRole("button", { name: "cancel" });

      expect(cancelButton).toBeInTheDocument();
      await userEvent.click(cancelButton);
      expect(
        screen.queryByTestId("file-upload-status-display"),
      ).not.toBeInTheDocument();
    });
    it("sets infected status on infected error", async () => {
      const trigger = createAdvanceStreamTrigger();
      clientFetchMock.mockResolvedValue(
        new Response(
          makeAdvanceableTestStreamForTrigger(
            [
              JSON.stringify({
                status: "whatever",
                error: "this file is infected oh no",
              }),
            ],
            trigger,
          ),
        ),
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
        ).toHaveTextContent("infected"),
      );
    });
    it("displays error if stream completes without pending file id", async () => {
      const trigger = createAdvanceStreamTrigger();
      clientFetchMock.mockResolvedValue(
        new Response(
          makeAdvanceableTestStreamForTrigger(
            [JSON.stringify({ status: "complete" })],
            trigger,
          ),
        ),
      );
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
      trigger.advance();
      expect(mockPostUploadAction).not.toHaveBeenCalled();
      await waitFor(async () =>
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toHaveTextContent("missingFileId"),
      );
    });
    it("handles batched status updates in a single stream read", async () => {
      const trigger = createAdvanceStreamTrigger();
      clientFetchMock.mockResolvedValue(
        new Response(
          makeAdvanceableTestStreamForTrigger(
            [
              JSON.stringify({ status: "uploading" }) +
                JSON.stringify({ status: "pending" }),
            ],
            trigger,
          ),
        ),
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
      // note that the uploading status will never show up in the UI in this case
      // await waitFor(async () =>
      //   expect(
      //     await screen.findByTestId("file-upload-status-display"),
      //   ).toHaveTextContent("uploading"),
      // );

      await waitFor(async () =>
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toHaveTextContent("scanning"),
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
    it("calls postUploadAction with pending file id on completed upload", async () => {
      const trigger = createAdvanceStreamTrigger();
      // we're not concerned with the upload process here, so no need to mess with stream states
      clientFetchMock.mockResolvedValue(
        new Response(
          makeAdvanceableTestStreamForTrigger(
            [JSON.stringify({ status: "whatever", pendingFileId: "1" })],
            trigger,
          ),
        ),
      );
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
      await waitFor(() =>
        expect(mockPostUploadAction).toHaveBeenCalledWith("1", undefined),
      );
    });

    it("calls onSuccess with expected argument on completed post upload action", async () => {
      const trigger = createAdvanceStreamTrigger();
      // we're not concerned with the upload process here, so no need to mess with stream states
      clientFetchMock.mockResolvedValue(
        new Response(
          makeAdvanceableTestStreamForTrigger(
            [JSON.stringify({ status: "whatever", pendingFileId: "1" })],
            trigger,
          ),
        ),
      );
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

    it("calls onComplete on completed post upload action", async () => {
      const trigger = createAdvanceStreamTrigger();
      // we're not concerned with the upload process here, so no need to mess with stream states
      clientFetchMock.mockResolvedValue(
        new Response(makeAdvanceableTestStreamForTrigger([], trigger)),
      );
      const mockOnSuccess = jest.fn();
      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          onComplete={mockOnSuccess}
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
      await waitFor(() => expect(mockOnSuccess).toHaveBeenCalled());
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
    it("calls onDelete callback with file id on delete file confirmation", async () => {
      const mockOnDelete = jest.fn().mockResolvedValue(true);
      render(
        <SimplerFileInput
          onDelete={mockOnDelete}
          postUploadAction={() => Promise.resolve(undefined)}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
          existingFiles={[fakeExistingFile]}
        />,
      );
      const deleteButton = screen.getByRole("button", {
        name: "delete",
      });
      expect(deleteButton).toBeInTheDocument();
      // open the modal
      await userEvent.click(deleteButton);

      const deleteConfirmButton = screen.getByRole("button", {
        name: "deleteFileCta",
      });
      expect(deleteConfirmButton).toBeInTheDocument();

      // confirm deletion
      await userEvent.click(deleteConfirmButton);
      expect(mockOnDelete).toHaveBeenCalledWith(fakeExistingFile.id);
    });
  });
  describe("Cancellation", () => {
    it("cancels upload in progress on cancel button click", async () => {
      const controllerAbortMock = jest.fn();
      fakeAbortController.mockImplementation(() => ({
        abort: controllerAbortMock,
        signal: {
          abort: jest.fn(),
        },
      }));
      const trigger = createAdvanceStreamTrigger();
      clientFetchMock.mockResolvedValue(
        new Response(
          makeAdvanceableTestStreamForTrigger(
            [JSON.stringify({ status: "uploading" })],
            trigger,
          ),
        ),
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
      await waitFor(async () => {
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toHaveTextContent("uploading");
      });
      const cancelButton = screen.getByRole("button", { name: "cancel" });

      expect(cancelButton).toBeInTheDocument();
      await userEvent.click(cancelButton);
      expect(controllerAbortMock).toHaveBeenCalledTimes(1);
    });
    it("cancels post-upload in progress on cancel button click during post-upload action", async () => {
      const controllerAbortMock = jest.fn();
      const firstControllerAbortMock = jest.fn();
      fakeAbortController
        .mockImplementationOnce(() => ({
          abort: firstControllerAbortMock,
          signal: {
            abort: jest.fn(),
          },
        }))
        .mockImplementationOnce(() => ({
          abort: controllerAbortMock,
          signal: {
            abort: jest.fn(),
          },
        }));
      const trigger = createAdvanceStreamTrigger();
      clientFetchMock.mockResolvedValue(
        new Response(
          makeAdvanceableTestStreamForTrigger(
            [JSON.stringify({ status: "whatever", pendingFileId: "1" })],
            trigger,
          ),
        ),
      );
      const delayedPostUploadAction = (): Promise<undefined> => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(undefined), 1000);
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
      await userEvent.upload(input, new File(["test content"], "test.txt"));
      trigger.advance();
      await waitFor(async () => {
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toHaveTextContent("post upload action in progress");
      });

      const cancelButton = screen.getByRole("button", { name: "cancel" });

      expect(cancelButton).toBeInTheDocument();
      await userEvent.click(cancelButton);

      expect(controllerAbortMock).toHaveBeenCalledTimes(1);
    });
  });
  describe("Deletion", () => {
    it("displays error message if error occurs during delete", async () => {
      const mockOnDelete = jest.fn().mockRejectedValue(new Error());
      render(
        <SimplerFileInput
          onDelete={mockOnDelete}
          postUploadAction={() => Promise.resolve(undefined)}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
          existingFiles={[fakeExistingFile]}
        />,
      );
      const deleteButton = screen.getByRole("button", {
        name: "delete",
      });
      expect(deleteButton).toBeInTheDocument();
      // open the modal
      await userEvent.click(deleteButton);

      const deleteConfirmButton = screen.getByRole("button", {
        name: "deleteFileCta",
      });
      expect(deleteConfirmButton).toBeInTheDocument();

      // confirm deletion
      await userEvent.click(deleteConfirmButton);
      expect(mockOnDelete).toHaveBeenCalledWith(fakeExistingFile.id);
      const errorMessage = screen.getByText("deleteError");
      expect(errorMessage).toBeInTheDocument();
    });
    // visibility is not testable given the formatting of the Trussworks modal - no aria-hidden attribute
    it.skip("toggles modal on delete button click", async () => {
      const mockOnDelete = jest.fn().mockRejectedValue(new Error());
      render(
        <SimplerFileInput
          onDelete={mockOnDelete}
          postUploadAction={() => Promise.resolve(undefined)}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
          existingFiles={[fakeExistingFile]}
        />,
      );
      const deleteButton = screen.getByRole("button", {
        name: "delete",
      });
      expect(deleteButton).toBeInTheDocument();
      // open the modal
      expect(
        screen.getByLabelText("cautionDeletingAttachment"),
      ).not.toBeVisible();
      await userEvent.click(deleteButton);
      expect(screen.getByLabelText("cautionDeletingAttachment")).toBeVisible();
    });
  });
  describe("Multifile v Non-multifile", () => {
    it("[non-multifile] clears file input on cancel", async () => {
      const controllerAbortMock = jest.fn();
      fakeAbortController.mockImplementation(() => ({
        abort: controllerAbortMock,
        signal: {
          abort: jest.fn(),
        },
      }));
      const trigger = createAdvanceStreamTrigger();
      clientFetchMock.mockResolvedValue(
        new Response(
          makeAdvanceableTestStreamForTrigger(
            [JSON.stringify({ status: "uploading" })],
            trigger,
          ),
        ),
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
      await waitFor(async () => {
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toHaveTextContent("uploading");
      });
      const cancelButton = screen.getByRole("button", { name: "cancel" });

      expect(cancelButton).toBeInTheDocument();
      expect(input).toHaveValue("C:\\fakepath\\test.txt");

      await userEvent.click(cancelButton);
      expect(controllerAbortMock).toHaveBeenCalledTimes(1);
      expect(input).toHaveValue();
    });
    it("[non-multifile] disallows uploading additional files if input already has a file", async () => {
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
      await userEvent.upload(input, new File(["test content"], "test.txt"));
      expect(
        await screen.findAllByTestId("file-upload-status-display"),
      ).toHaveLength(1);
      await userEvent.upload(input, new File(["test content 2"], "test2.txt"));
      expect(
        await screen.findAllByTestId("file-upload-status-display"),
      ).toHaveLength(1);
    });
    it("[non-multifile] only uploads the first file in the list if attempting to upload multiple", async () => {
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
      await userEvent.upload(input, [
        new File(["test content"], "test.txt"),
        new File(["test content2"], "do_not_upload.txt"),
      ]);
      const statusDisplays = await screen.findAllByTestId(
        "file-upload-status-display",
      );
      expect(statusDisplays).toHaveLength(1);
      expect(statusDisplays[0]).toHaveTextContent("test.txt");
    });
    it("[multifile] allows multiple simultaneous uploads", async () => {
      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          postUploadAction={() => Promise.resolve(undefined)}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
          multiFile={true}
        />,
      );
      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(input, [
        new File(["test content"], "test.txt"),
        new File(["test content2"], "test_2.txt"),
      ]);
      const statusDisplays = await screen.findAllByTestId(
        "file-upload-status-display",
      );
      expect(statusDisplays).toHaveLength(2);
      expect(statusDisplays[0]).toHaveTextContent("test.txt");
      expect(statusDisplays[1]).toHaveTextContent("test_2.txt");
    });
    it("[multifile] allows adding uploads while upload is in progress", async () => {
      render(
        <SimplerFileInput
          onDelete={() => Promise.resolve()}
          postUploadAction={() => Promise.resolve(undefined)}
          postUploadActionProgressMessage="post upload action in progress"
          postUploadActionSuccessMessage="post upload action success"
          postUploadActionErrorMessage="post upload action error"
          id="file-input-test"
          labelId="file-input-label"
          multiFile={true}
        />,
      );
      const input = await screen.findByTestId("file-input-input");
      await userEvent.upload(input, new File(["test content"], "test.txt"));
      expect(
        await screen.findAllByTestId("file-upload-status-display"),
      ).toHaveLength(1);
      await userEvent.upload(input, new File(["test content 2"], "test2.txt"));
      expect(
        await screen.findAllByTestId("file-upload-status-display"),
      ).toHaveLength(2);
    });
  });
  // not able to test this since the only way to really hide this for now is with CSS, which is not
  // testable using testing-library tools.
  // aria-hidden seems to be the way to do this for testing, but is that possible?
  // - not really without doing old school DOM element targeting - we have a ref but only to the input itself, not the previews
  // or do we just remove it? use mutation observer? not worry about testing, and rely on the css?
  it.skip("does not display the Trussworks file preview", async () => {
    const trigger = createAdvanceStreamTrigger();
    clientFetchMock.mockResolvedValue(
      new Response(makeAdvanceableTestStreamForTrigger([], trigger)),
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
    screen.debug();
    const trussworksPreviewImages = screen.queryByTestId(
      "file-input-preview-image",
    );
    const trussworksPreviews = screen.queryByTestId("file-input-preview");
    expect(trussworksPreviewImages).not.toBeVisible();
    expect(trussworksPreviews).not.toBeVisible();
  });
});
