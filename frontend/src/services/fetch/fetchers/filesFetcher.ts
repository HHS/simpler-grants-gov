import { ApiRequestError } from "src/errors";
import { FileUploadDetailsResponse } from "src/types/apiResponseTypes";
import { OptionalStringDict } from "src/types/generalTypes";
import { createFormData } from "src/utils/fileUtils/createFormData";

import { fetchFileUploadWithMethod } from "./fetchers";

/*
  These three calls made in sequence form the full file upload process

  1. fetchFileUploadDetails
  Calls API to create a pending file record and obtain details necessary to call to S3 to begin uploading the file
  Returns a pending_file_id that will be used to call fetchFileScanStatus to track upload progress

  2. startFileUpload
  Using the url and body returned from fetchFileUploadDetails, makes a fire and forget call to S3 to initiate
  the file upload

  3. fetchFileScanStatus
  Calls to the API to fetch a stream that will update as the upload process progresses. Stream will be consumed by
  the calling handler and results streamed onward to the client
*/

export const fetchFileUploadDetails = async (
  fileName: string,
  mimeType: string,
): Promise<FileUploadDetailsResponse> => {
  const uploadDetailsResponse = await fetchFileUploadWithMethod("POST")({
    body: {
      file_name: fileName,
      mime_type: mimeType,
    },
  });
  return (await uploadDetailsResponse.json()) as FileUploadDetailsResponse;
};

// uses the url and body parameters return by the API in the fetchFileUploadDetails call
export const uploadFileToS3 = async (
  url: string,
  body: OptionalStringDict,
  file: File,
): Promise<boolean> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileFormData = createFormData(file.name, buffer, file.type, "file");
    Object.entries(body).forEach(([key, value]) => {
      // don't overwrite the file field
      if (value && key !== "file") {
        fileFormData.append(key, value);
      }
    });
    const s3Response = await fetch(url, {
      method: "POST",
      body: fileFormData,
    });
    if (s3Response.ok) {
      return true;
    }
    throw new ApiRequestError("Error uploading file to S3");
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// opens a stream with the API to fetch scan status
export const fetchFileScanStatus = async (
  pendingFileId: string,
): Promise<ReadableStream<string>> => {
  const fileScanStatusResponse = await fetchFileUploadWithMethod("GET")({
    subPath: `/${pendingFileId}/results`,
  });
  // may need to do some work here if the body isn't readable as a string in the end
  return fileScanStatusResponse.body as unknown as ReadableStream<string>;
};
