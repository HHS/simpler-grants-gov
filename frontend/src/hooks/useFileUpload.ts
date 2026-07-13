import { noop } from "lodash";
import { useClientFetch } from "src/hooks/useClientFetch";
import {
  FileUploadProcessStatus,
  FileUploadStatusUpdate,
  PostUploadAction,
} from "src/types/fileUploadTypes";
import { createFormDataForFile } from "src/utils/fileUtils/createFormData";
import { unbatchStreamChunkJSON } from "src/utils/streamUtils";

import { useCallback, useMemo, useRef, useState } from "react";

type FileUploadCallbacks = {
  onError?: (err: Error) => void;
  onSuccess?: (postUploadResult: unknown) => void;
  onStart?: () => void;
  onComplete?: () => void;
  postUploadAction: PostUploadAction;
};

export const useFileUpload = ({
  onStart = noop,
  onSuccess = noop,
  onError = noop,
  onComplete = noop,
  postUploadAction,
}: FileUploadCallbacks) => {
  const { clientFetch } = useClientFetch<Response>("unable to upload file", {
    authGatedRequest: true,
    jsonResponse: false,
  });

  const alreadyCalled = useRef<boolean>(false);

  const [uploadError, setUploadError] = useState<string | undefined>();
  const [currentStatus, setCurrentStatus] = useState<FileUploadProcessStatus>();
  const [fileName, setFileName] = useState<string>();
  const [uploadController, setUploadController] = useState<AbortController>();
  const [postUploadController, setPostUploadController] =
    useState<AbortController>();
  const [responseReader, setResponseReader] =
    useState<ReadableStreamDefaultReader>();

  // exposed methods for upload management
  const handleError = useCallback(
    (e: Error) => {
      // skip handling for expected abort related errors
      if (e.name !== "AbortError") {
        onError(e);
        setUploadError(e.message);
      }
    },
    [setUploadError, onError],
  );

  const handleCancel = useCallback(async () => {
    setCurrentStatus(undefined);
    try {
      uploadController?.abort();
    } catch (_e) {
      // if the controller has already been aborted, no problem
    }
    try {
      postUploadController?.abort();
    } catch (_e) {
      // if the controller has already been aborted, no problem
    }
    try {
      await responseReader?.cancel();
    } catch (_e) {
      // if the reader is already closed, no problem
      return;
    }
  }, [uploadController, postUploadController, responseReader]);

  const dismissError = useCallback(() => {
    setCurrentStatus(undefined);
    setUploadError(undefined);
  }, []);

  const readResponseStream = useCallback(
    async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
      // can't use state to track this because it would need to be both set and referenced within the same useCallback function call
      // and the function can't be recalculated to include updated state values while running
      let newFileId: string;
      let error: Error;
      const process = async (): Promise<string> => {
        return reader.read().then(({ value, done }) => {
          if (done) {
            return newFileId;
          }
          let payloadJson: FileUploadStatusUpdate;
          const payloadString = new TextDecoder().decode(value);
          const payloadJsonStrings = unbatchStreamChunkJSON(payloadString);
          // process each json chunk, since it's possible that chunks were batched
          // it may not be doing anything from the UI perspective to process anything except the final
          // batched update, but leaving this just in case we need to process a file id from a batched update
          payloadJsonStrings.forEach((payloadString: string) => {
            try {
              payloadJson = JSON.parse(payloadString) as FileUploadStatusUpdate;
            } catch (e) {
              console.error(
                "Error parsing json from file upload stream payload",
                payloadString,
              );
              throw e;
            }
            if (payloadJson?.error) {
              // in order to distinguish "infected" cases from general failure during scan
              // we need to specially set the status here
              if (payloadJson.error.match("infected")) {
                setCurrentStatus("infected");
              }
              error = new Error(payloadJson.error);
            } else if (payloadJson?.status) {
              setCurrentStatus(payloadJson.status as FileUploadProcessStatus);
              if (payloadJson.pendingFileId) {
                newFileId = payloadJson.pendingFileId;
              }
            }
          });
          // if the stream ended, newFileId will be set. Return that and stop reading
          if (newFileId) {
            return newFileId;
          }
          if (error) {
            throw error;
          }
          return process();
        });
      };
      try {
        return process();
      } catch (e) {
        console.error("Error in file upload process stream response", e);
        throw e;
      }
    },
    [setCurrentStatus],
  );

  const uploadFile = useCallback(
    (fileToUpload: File) => {
      if (alreadyCalled.current) {
        console.warn(
          "uploadFile is only meant to be called once per hook instance",
        );
        return;
      }
      alreadyCalled.current = true;
      const fileName = fileToUpload.name || "No Filename!";
      const uploadAbortController = new AbortController();

      setFileName(fileName);
      setCurrentStatus("queued");
      setUploadController(uploadAbortController);

      try {
        onStart();
      } catch (e) {
        handleError(e as Error);
        return;
      }
      // start upload
      void createFormDataForFile(fileToUpload)
        .then((fileFormData) => {
          return clientFetch("/api/file", {
            method: "POST",
            body: fileFormData,
            signal: uploadAbortController?.signal,
          });
        })
        // process streaming response
        .then((response: Response) => {
          const reader = response.body?.getReader();
          setResponseReader(reader as ReadableStreamDefaultReader<Uint8Array>);
          return readResponseStream(
            reader as ReadableStreamDefaultReader<Uint8Array>,
          );
        })
        // run post upload action
        .then((pendingFileId) => {
          if (!pendingFileId) {
            // note that the missing file id error display is predicated on the timing of
            // an error occurring in the "complete" state
            throw new Error(
              "upload stream completed without sending pending file id, possible due to upload cancellation",
            );
          }
          const postUploadAbortController = new AbortController();
          setCurrentStatus("post-upload");
          setPostUploadController(postUploadAbortController);
          return postUploadAction(
            pendingFileId,
            postUploadAbortController.signal,
          );
        })
        // run complete actions
        .then((postUploadResult: unknown) => {
          // complete status will persist until refresh or form change
          setCurrentStatus("success");
          onSuccess(postUploadResult);
          return;
        })
        .catch((e: Error) => {
          handleError(e);
        })
        .finally(() => {
          onComplete();
        });
    },
    [
      clientFetch,
      handleError,
      onComplete,
      onSuccess,
      postUploadAction,
      readResponseStream,
      setCurrentStatus,
      setPostUploadController,
      setResponseReader,
      onStart,
    ],
  );

  const useFileUploadInterface = useMemo(
    () => ({
      uploadError,
      currentStatus,
      fileName,
      uploadFile,
      handleCancel,
      dismissError,
    }),
    [
      uploadError,
      currentStatus,
      fileName,
      uploadFile,
      handleCancel,
      dismissError,
    ],
  );

  return useFileUploadInterface;
};
