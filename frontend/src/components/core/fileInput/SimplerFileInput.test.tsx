/**
 * @jest-environment ./src/utils/testing/jsdomNodeEnvironment.ts
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
      fireEvent.change(input, {
        target: {
          files: new File(["test content"], "test.txt", {
            type: "text/plain",
          }),
        },
      });
      expect(
        await screen.findByTestId("file-upload-status-display"),
      ).toBeInTheDocument();
    });
    it("displays a 'queued' message when queued", async () => {
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
      const input = await screen.findByTestId("file-input-input");
      fireEvent.change(input, {
        target: {
          files: new File(["test content"], "test.txt", {
            type: "text/plain",
          }),
        },
      });
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
      fireEvent.change(input, {
        target: {
          files: new File(["test content"], "test.txt", {
            type: "text/plain",
          }),
        },
      });
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
      fireEvent.change(input, {
        target: {
          files: new File(["test content"], "test.txt", {
            type: "text/plain",
          }),
        },
      });
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
      fireEvent.change(input, {
        target: {
          files: new File(["test content"], "test.txt", {
            type: "text/plain",
          }),
        },
      });
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
      fireEvent.change(input, {
        target: {
          files: new File(["test content"], "test.txt", {
            type: "text/plain",
          }),
        },
      });
      await waitFor(async () =>
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toHaveTextContent("error"),
      );
    });

    it.only("displays an upload error if error occurs during upload process", async () => {
      const trigger = createAdvanceStreamTrigger();
      clientFetchMock.mockResolvedValue(
        new Response(makeStream(["uploading", "error"], trigger)),
      );
      // clientFetchMock.mockRejectedValue(new Error());
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
      fireEvent.change(input, {
        target: {
          files: new File(["test content"], "test.txt", {
            type: "text/plain",
          }),
        },
      });
      trigger.advance();
      await new Promise((resolve) => setTimeout(resolve, 10));
      trigger.advance();
      await waitFor(async () =>
        expect(
          await screen.findByTestId("file-upload-status-display"),
        ).toHaveTextContent("uploadError"),
      );
    });
  });
});
