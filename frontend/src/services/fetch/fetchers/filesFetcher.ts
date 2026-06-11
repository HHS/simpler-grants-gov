import { FileUploadDetailsResponse } from "src/types/apiResponseTypes";
import { createFormData } from "src/utils/fileUtils/createFormData";

import { fetchFileUploadWithMethod } from "./fetchers";

/*
  These three calls made in sequence form the full file upload process

  1. fetchFileUploadDetails
  Calls API to create a pending file record and obtain details necessary to call to S3 to begin uploading the file
  Returns a pending_file_id that will be used to call fetchFileUploadStatus to track upload progress

  2. startFileUpload
  Using the url and body returned from fetchFileUploadDetails, makes a fire and forget call to S3 to initiate
  the file upload

  3. fetchFileUploadStatus
  Calls to the API to fetch a stream that will update as the upload process progresses. Stream will be consumed by
  the calling handler and results streamed onward to the client
*/

export const fetchFileUploadDetails = async (
  file: File,
): Promise<FileUploadDetailsResponse> => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const fileFormData = createFormData(file.name, buffer, file.type);
  const uploadDetailsResponse = await fetchFileUploadWithMethod("POST")({
    body: fileFormData,
  });
  // return Promise.resolve({
  //   url: "any --- url",
  //   pending_file_id: "1",
  //   body: {
  //     arbitraryAwsBodyKey: "arbitrary aws body value",
  //   },
  // });
};

// a fire and forget request to S3 to start file upload using the
// url and body parameters return by the API in the fetchFileUploadDetails call
// progress of the upload at this point will be tracked by the fetchFileUploadStatus call
export const startFileUpload = (url: string, body: unknown) => {
  try {
    const bodyString = JSON.stringify(body);
    void fetch(url, {
      method: "POST",
      body: bodyString,
    });
  } catch (e) {
    console.error("Error calling AWS to start S3 Upload");
    throw e;
  }
};

export const fetchFileUploadStatus = async (
  _pendingFileId: string,
): Promise<ReadableStream> => {
  return Promise.resolve(new ReadableStream());
};
