import { readError } from "src/errors";
import {
  fetchFileScanStatus,
  fetchFileUploadDetails,
  uploadFileToS3,
} from "src/services/fetch/fetchers/filesFetcher";
import { FileUploadStatusUpdate } from "src/types/fileUploadTypes";

import { NextRequest, NextResponse } from "next/server";

// reads from the status update stream returned by the /results API and writes incoming data
// to the client response stream
// apparently the API response stream will timeout after 60 seconds, and deliver chunks every 3 seconds
const pipeStatusStreamToResponse = async (
  outputController: ReadableStreamDefaultController,
  inputStream: ReadableStreamDefaultReader<Uint8Array>,
  previousState?: string,
) => {
  const { value, done } = await inputStream.read();
  let responseState = previousState;
  // this structure is dependent on what the API will actually send back, and will need to be adjusted
  if (value) {
    let payloadJson: { data: FileUploadStatusUpdate };
    try {
      const payloadString = new TextDecoder().decode(value);
      payloadJson = JSON.parse(payloadString) as {
        data: FileUploadStatusUpdate;
      };
    } catch (e) {
      console.error("Error parsing json from file upload stream payload");
      throw e;
    }
    // we will expect the API to deliver duplicate chunks until a state change, but will only write to our
    // output stream when the state changes
    const statusOnRead = payloadJson.data.status;
    if (previousState !== statusOnRead) {
      // infected status won't come through as an error, we'll have to throw our own
      if (statusOnRead === "infected") {
        throw new Error("Virus scan failed, file infected");
      }
      responseState = statusOnRead;
      outputController.enqueue(JSON.stringify({ status: statusOnRead }));
    }
  }
  if (done) {
    return;
  }
  return pipeStatusStreamToResponse(
    outputController,
    inputStream,
    responseState,
  );
};

// This is an async function that will perform all of the file upload orchestraction
// It is not being awaited since it needs to not block the sending of the response
// The process here will progressively write status updates to the response stream after it
// has been sent to the client and will continue to write to the stream until the stream is closed
const orchestrateFileUpload = async (
  responseStreamController: ReadableStreamDefaultController,
  file: File,
) => {
  responseStreamController.enqueue(JSON.stringify({ status: "queued" }));
  // call Simpler API to obtain details for S3 upload and pending file id
  const fileUploadDetails = await fetchFileUploadDetails(file.name, file.type);
  await new Promise((resolve) => setTimeout(resolve, 5000));
  responseStreamController.enqueue(JSON.stringify({ status: "uploading" }));

  // upload file to s3
  await uploadFileToS3(fileUploadDetails.url, fileUploadDetails.body, file);
  await new Promise((resolve) => setTimeout(resolve, 5000));
  responseStreamController.enqueue(JSON.stringify({ status: "starting-scan" }));

  // open stream to fetch upload and scan progress updates
  const fileUploadStatusResponse = await fetchFileScanStatus(
    fileUploadDetails.pending_file_id,
  );

  await pipeStatusStreamToResponse(
    responseStreamController,
    fileUploadStatusResponse.getReader(),
  );

  // this is here in order to send back the file id
  await new Promise((resolve) => setTimeout(resolve, 5000));
  responseStreamController.enqueue(
    JSON.stringify({
      status: "scan-complete",
      pendingFileId: fileUploadDetails.pending_file_id,
    }),
  );
  return fileUploadDetails.pending_file_id;
};

// creates a new stream to use for the client response and makes all
// upload related calls within the context of the stream
const processUploadInStream = (file: File): ReadableStream<string> => {
  const responseStream = new ReadableStream<string>({
    start: async (responseStreamController) => {
      try {
        await orchestrateFileUpload(responseStreamController, file);
        responseStreamController.close();
      } catch (e) {
        console.error("Error in file upload orchestration stream", e);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        responseStreamController.enqueue(
          JSON.stringify({
            status: "error",
            error: (e as Error).message,
          }),
        );
        responseStreamController.close();
      }
    },
  });
  return responseStream;
};

// uploads file to S3 and sends the client updates about upload and virus scan progress
export const handleFileUpload = async (request: NextRequest) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file_attachment") as File;

    if (!file) {
      console.error("File upload attempt missing file");
      return Response.json(
        { message: "File upload attempt missing file" },
        { status: 400 },
      );
    }

    // all calls to manage upload are made within the streaming process
    const responseStream = processUploadInStream(file);
    const responseToClient = new NextResponse(responseStream);

    return responseToClient;
    // note that this code is likely unreachable - as long as a file is provided we'd expect
    // this endpoint to always return a 200, and an errors will be caught and delivered within
    // the stream. We should do work up a test to see what happens if the stream errors unexpectedly, though. That also likely wouldn't be caught here, though, since the response would already have been sent.
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
