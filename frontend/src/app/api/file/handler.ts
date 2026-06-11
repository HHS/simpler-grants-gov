import { readError } from "src/errors";
import {
  fetchFileUploadDetails,
  fetchFileUploadStatus,
  startFileUpload,
} from "src/services/fetch/fetchers/filesFetcher";

import { NextRequest, NextResponse } from "next/server";

// reads from the status update stream returned by the API and writes incoming data
// to the stream that will be sent in the response to the client
const makeFileStatusResponseStream = (
  inputStream: ReadableStreamDefaultReader<string>,
) => {
  const readInputStream = async (
    outputController: ReadableStreamDefaultController,
  ) => {
    const { value, done } = await inputStream.read();
    if (value) {
      outputController.enqueue(value);
    }
    if (done) {
      outputController.close();
      return;
    }
    return readInputStream(outputController);
  };
  const outputStream = new ReadableStream({
    start: async (controller) => {
      return await readInputStream(controller);
    },
  });
  return outputStream;
};

// uploads file to S3 and sends the client updates about upload and virus scan progress
export const handleFileUpload = async (request: NextRequest) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    // call Simpler API to obtain details for S3 upload and pending file id
    const fileUploadDetails = await fetchFileUploadDetails(file);
    // fire call to S3 to begin upload process
    startFileUpload(fileUploadDetails.url, fileUploadDetails.body);
    // open stream to fetch upload and scan progress updates
    const fileUploadStatusResponse = await fetchFileUploadStatus(
      fileUploadDetails.pending_file_id,
    );
    // create a stream to consume progress updates from the API and send them back to the client
    const responseStream = makeFileStatusResponseStream(
      (fileUploadStatusResponse as ReadableStream<string>).getReader(),
    );
    const responseToClient = new NextResponse(responseStream);
    return responseToClient;
  } catch (e) {
    console.error(e);
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to upload file: ${message}`,
      },
      { status },
    );
  }
};
