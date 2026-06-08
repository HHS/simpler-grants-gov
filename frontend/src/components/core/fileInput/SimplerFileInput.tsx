import { noop } from "lodash";
import { useClientFetch } from "src/hooks/useClientFetch";
import {
  FileUploadProcessStatus,
  PostUploadAction,
  UploadFileMetadata,
} from "src/types/fileUploadTypes";

import { useCallback, useRef, useState } from "react";
import { FileInput, FileInputRef } from "@trussworks/react-uswds";

import { FileInputExistingFiles } from "./FileInputExistingFiles";
import { FileUploadStatusDisplay } from "./FileUploadStatusDisplay";

type SimplerFileInputProps = {
  postUploadAction: PostUploadAction;
  postUploadActionProgressMessage: string;
  postUploadActionSuccessMessage?: string;
  postUploadActionErrorMessage?: string;
  onDelete: (fileId: string) => Promise<unknown>; // what should the delete callback return? do we need to dynamically type this?
  onError?: (err: Error) => void;
  onSuccess?: (postUploadResult: unknown) => void;
  onStart?: () => void;
  id: string;
  existingFiles?: UploadFileMetadata[];
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  labelId: string;
};

const UPLOAD_ENDPOINT = "something_fake_for_now";

/*
things this needs to do

* show the custom progress indicator [x]
* show the correct progress based on what the API sends back [x]
* call onError on error [x]
* call onSuccess on success [x]
* call onStart on start [x]
* call postUploadAction on successful upload [x]

* hide the native progress indicator [x]

* display existing files as expected [x]

* cancel a download

* delete a previously uploaded file [x]

*/

export const SimplerFileInput = ({
  postUploadAction,
  postUploadActionProgressMessage,
  postUploadActionSuccessMessage,
  postUploadActionErrorMessage,
  id,
  labelId,
  existingFiles,
  onDelete,
  onError = noop,
  onSuccess = noop,
  onStart = noop,
  disabled = false,
  readOnly = false,
  required = false,
}: SimplerFileInputProps) => {
  const fileInputRef = useRef<FileInputRef | null>(null);

  const { clientFetch } = useClientFetch<Response>("unable to upload file", {
    jsonResponse: true,
    authGatedRequest: true,
  });

  const [uploadError, setUploadError] = useState<
    { status: FileUploadProcessStatus | undefined; message: string } | undefined
  >();
  const [currentStatus, setCurrentStatus] = useState<FileUploadProcessStatus>();

  const handleError = useCallback(
    (e: Error) => {
      onError(e);
      setUploadError({ status: currentStatus, message: e.message });
    },
    [currentStatus, setUploadError, onError],
  );

  const readResponseStream = useCallback(
    (reader: ReadableStreamDefaultReader) => {
      const process = (): Promise<string> => {
        return reader
          .read()
          .then(({ value, done }) => {
            setCurrentStatus(value as FileUploadProcessStatus);
            if (done) {
              return value as string;
            }
            return process();
          })
          .catch((e) => {
            console.error("error reading response stream", e);
            throw e;
          });
      };
      return process();
    },
    [setCurrentStatus],
  );

  const onFileSelect = useCallback(
    (_changeEvent: unknown) => {
      setCurrentStatus("queued");
      try {
        onStart();
      } catch (e) {
        handleError(e as Error);
        return;
      }
      // start upload
      return (
        clientFetch(UPLOAD_ENDPOINT)
          // process streaming response
          .then((response: Response) => {
            const reader =
              response.body?.getReader() as ReadableStreamDefaultReader;
            return readResponseStream(reader);
          })
          // run post upload action
          .then((fileId) => {
            setCurrentStatus("post-upload");
            return postUploadAction(fileId);
          })
          // run complete actions
          .then((postUploadResult: unknown) => {
            setCurrentStatus("complete");
            onSuccess(postUploadResult);
            return;
          })
          .catch((e: Error) => {
            handleError(e);
          })
      );
    },
    [
      clientFetch,
      readResponseStream,
      onStart,
      onSuccess,
      postUploadAction,
      handleError,
    ],
  );

  console.log("!!!", currentStatus);
  return (
    <>
      <FileInput
        id={id}
        name={id}
        ref={fileInputRef}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        onChange={(e) => {
          void onFileSelect(e);
        }}
        aria-describedby={labelId}
        aria-invalid={!!uploadError}
      />
      {currentStatus ? (
        <FileUploadStatusDisplay
          error={!!uploadError}
          status={currentStatus}
          postUploadActionProgressMessage={postUploadActionProgressMessage}
          postUploadActionSuccessMessage={postUploadActionSuccessMessage}
          postUploadActionErrorMessage={postUploadActionErrorMessage}
        />
      ) : null}
      <FileInputExistingFiles
        existingFiles={existingFiles}
        onDelete={onDelete}
      />
    </>
  );
};
