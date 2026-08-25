import { readError } from "src/errors";
import { fetchFileScanStatus } from "src/services/fetch/fetchers/filesFetcher";
import { FileResultsMetadata } from "src/types/fileUploadTypes";

import { NextRequest } from "next/server";

type FileScanResultChunk = {
  data: {
    file_metadata: FileResultsMetadata | null;
  };
};

// Reads a single chunk from the existing file-scan-results stream and returns its
// file_metadata as a plain JSON response, rather than re-streaming it. Callers only use
// this once scanning has already completed (confirmed via a prior successful upload), so
// the first chunk is expected to already carry the completed file_metadata.
export const getFileResultsMetadata = async (
  _request: NextRequest,
  { params }: { params: Promise<{ pendingFileId: string }> },
) => {
  try {
    const { pendingFileId } = await params;
    const scanStatusStream = await fetchFileScanStatus(pendingFileId);
    const reader = scanStatusStream.getReader();
    const { value } = await reader.read();
    // Don't block on cancellation: /results is a long-poll connection the backend can
    // keep open for further updates, and canceling it can hang waiting for that
    // connection to actually close. We already have what we need from the first chunk,
    // so let this settle in the background instead of blocking the response on it.
    void reader.cancel().catch(() => {});

    if (!value) {
      return Response.json(
        { message: "No file scan result available" },
        { status: 404 },
      );
    }

    const payload = JSON.parse(
      new TextDecoder().decode(value),
    ) as FileScanResultChunk;

    if (!payload.data.file_metadata) {
      return Response.json(
        { message: "File scan not yet complete" },
        { status: 409 },
      );
    }

    return Response.json({ file_metadata: payload.data.file_metadata });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      { message: `Error fetching file results metadata: ${message}` },
      { status },
    );
  }
};
