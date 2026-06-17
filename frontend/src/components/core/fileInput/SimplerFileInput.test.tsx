/**
 * @jest-environment ./src/utils/testing/jsdomNodeEnvironment.ts
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslationsMock } from "src/utils/testing/intlMocks";
import {
  createAdvanceStreamTrigger,
  makeAdvanceableTestStreamForTrigger,
} from "src/utils/testing/streamTestUtils";

import { SimplerFileInput } from "./SimplerFileInput";

const clientFetchMock = jest.fn();
const fakeAbortController = jest.fn();

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

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

describe("SimplerFileInput", () => {
  beforeEach(() => {
    originalAbortController = global.AbortController;
    global.AbortController = fakeAbortController;
  });
  afterEach(() => {
    global.AbortController = originalAbortController;
    jest.resetAllMocks();
  });
  describe("Status display", () => {
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
              JSON.stringify({ status: "scanning" }),
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
              JSON.stringify({ status: "scanning" }),
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
      // we're not concerned with the upload process here, so no need to mess with stream states
      clientFetchMock.mockResolvedValue(
        new Response(makeAdvanceableTestStreamForTrigger([], trigger)),
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
        new Response(makeAdvanceableTestStreamForTrigger([], trigger)),
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

    it("displays an scan error if error occurs during scan process", async () => {
      const trigger = createAdvanceStreamTrigger();
      clientFetchMock.mockResolvedValue(
        new Response(
          makeAdvanceableTestStreamForTrigger(
            [
              JSON.stringify({ status: "uploading" }),
              JSON.stringify({ status: "scanning" }),
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
      clientFetchMock.mockResolvedValue(
        new Response(makeAdvanceableTestStreamForTrigger([], trigger)),
      );
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
      clientFetchMock.mockResolvedValue(
        new Response(makeAdvanceableTestStreamForTrigger([], trigger)),
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
      await waitFor(() => expect(mockPostUploadAction).toHaveBeenCalled());
    });

    it("calls onSuccess with expected argument on completed post upload action", async () => {
      const trigger = createAdvanceStreamTrigger();
      // we're not concerned with the upload process here, so no need to mess with stream states
      clientFetchMock.mockResolvedValue(
        new Response(makeAdvanceableTestStreamForTrigger([], trigger)),
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
    fakeAbortController
      .mockImplementationOnce(() => ({
        abort: jest.fn(),
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
      new Response(makeAdvanceableTestStreamForTrigger([], trigger)),
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
      ).toHaveTextContent("post upload action in progress");
    });

    const cancelButton = screen.getByRole("button", { name: "cancel" });

    expect(cancelButton).toBeInTheDocument();
    await userEvent.click(cancelButton);

    expect(controllerAbortMock).toHaveBeenCalledTimes(1);
  });
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
