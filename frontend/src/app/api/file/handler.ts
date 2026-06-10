import { readError } from "src/errors";
import {
  fetchFileUploadDetails,
  fetchFileUploadStatus,
  startFileUpload,
} from "src/services/fetch/fetchers/filesFetcher";

import { NextRequest, NextResponse } from "next/server";

const makeFileStatusResponseStream = (
  statusStream: ReadableStreamDefaultReader,
) => {
  //   const stream = new ReadableStream({
  //   start: (controller) => {
  //     const intervalId = setInterval(() => {
  //       try {
  //         if (queueMe === maxQueues) {
  //           controller.close();
  //           clearInterval(intervalId);
  //           queueMe = 0;
  //           return;
  //         }
  //         controller.enqueue(queueMe.toString());
  //         queueMe++;
  //       } catch (e) {
  //         queueMe = 0;
  //         console.error(e);
  //         controller.close();
  //         clearInterval(intervalId);
  //       }
  //     }, 1000);
  //   },
  // });
  const stream = new ReadableStream({
    start: (controller) => {
      const intervalId = setInterval(() => {
        try {
          if (queueMe === maxQueues) {
            controller.close();
            clearInterval(intervalId);
            queueMe = 0;
            return;
          }
          controller.enqueue(queueMe.toString());
          queueMe++;
        } catch (e) {
          queueMe = 0;
          console.error(e);
          controller.close();
          clearInterval(intervalId);
        }
      }, 1000);
    },
  });
  return statusStream.read();
  return stream;
};

export const handleFileUpload = async (request: NextRequest) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileUploadDetails = await fetchFileUploadDetails(file);
    startFileUpload(fileUploadDetails.url, fileUploadDetails.body);
    const fileUploadStatusResponse = await fetchFileUploadStatus(
      fileUploadDetails.pending_file_id,
    );
    const responseStream = makeFileStatusResponseStream(
      fileUploadStatusResponse.getReader(),
    );
    const responseToClient = new NextResponse(responseStream);

    return responseToClient;
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to submit application: ${message}`,
      },
      { status },
    );
  }
};
