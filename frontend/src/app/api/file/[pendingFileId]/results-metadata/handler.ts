import { readError } from "src/errors";
import { fetchFileScanStatus } from "src/services/fetch/fetchers/filesFetcher";
import { FileResultsMetadata } from "src/types/fileUploadTypes";

import { NextRequest } from "next/server";

type FileScanResultChunk = {
  data: {
    file_metadata: FileResultsMetadata | null;
  };
};

// Reads through the existing file-scan-results stream and returns its file_metadata as a
// plain JSON response, rather than re-streaming it. /results is a long-poll connection
// that keeps delivering updated chunks for up to ~60s until the scan reaches a terminal
// status - a single read can land on a not-yet-terminal chunk (e.g. a slow-scanning file
// that outlasted the *previous* stream's own 60s budget before this route was even
// called), so this loops through the same fresh 60s window rather than assuming the
// first chunk is already the terminal one.
export const getFileResultsMetadata = async (
  _request: NextRequest,
  { params }: { params: Promise<{ pendingFileId: string }> },
) => {
  try {
    const { pendingFileId } = await params;
    const scanStatusStream = await fetchFileScanStatus(pendingFileId);
    const reader = scanStatusStream.getReader();

    let sawAnyChunk = false;
    let fileMetadata: FileResultsMetadata | null = null;

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (value) {
          sawAnyChunk = true;
          const payload = JSON.parse(
            new TextDecoder().decode(value),
          ) as FileScanResultChunk;
          if (payload.data.file_metadata) {
            fileMetadata = payload.data.file_metadata;
            break;
          }
        }
        if (done) {
          break;
        }
      }
    } finally {
      // Don't block on cancellation: /results is a long-poll connection the backend can
      // keep open for further updates, and canceling it can hang waiting for that
      // connection to actually close. We already have what we need (or have exhausted
      // the stream, or hit a parse error), so let this settle in the background instead
      // of blocking the response - and run it in a finally so a malformed chunk that
      // throws mid-loop still gets the connection torn down instead of leaking it.
      void reader.cancel().catch(() => {});
    }

    if (!sawAnyChunk) {
      return Response.json(
        { message: "No file scan result available" },
        { status: 404 },
      );
    }

    if (!fileMetadata) {
      return Response.json(
        { message: "File scan not yet complete" },
        { status: 409 },
      );
    }

    return Response.json({ file_metadata: fileMetadata });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      { message: `Error fetching file results metadata: ${message}` },
      { status },
    );
  }
};
