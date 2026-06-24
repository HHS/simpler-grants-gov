import { noop } from "lodash";
import { useClientFetch } from "src/hooks/useClientFetch";
import {
  FileUploadProcessStatus,
  FileUploadStatusUpdate,
  PostUploadAction,
} from "src/types/fileUploadTypes";
import { createFormDataForFile } from "src/utils/fileUtils/createFormData";
import { unbatchStreamChunkJSON } from "src/utils/streamUtils";

import { ChangeEvent, useCallback, useMemo, useState } from "react";

type FileUploadCallbacks = {
  onError?: (err: Error) => void;
  onSuccess?: (postUploadResult: unknown) => void;
  onStart?: () => void;
  onComplete?: () => void;
  postUploadAction: PostUploadAction;
};

type FileUploadInternalState = {
  fileName?: string;
  uploadError?: string;
  currentStatus?: FileUploadProcessStatus;
  uploadController?: AbortController;
  postUploadController?: AbortController;
  responseReader?: ReadableStreamDefaultReader;
};

export const useFileUpload = ({
  onStart = noop,
  onSuccess = noop,
  onComplete = noop,
  onError = noop,
  postUploadAction,
}: FileUploadCallbacks) => {
  const { clientFetch } = useClientFetch<Response>("unable to upload file", {
    authGatedRequest: true,
    jsonResponse: false,
  });

  // full state
  const [uploadStates, setUploadStates] = useState<
    Record<string, FileUploadInternalState>
  >({});

  // create or return current state for a given upload
  const getCurrentStateFor = useCallback(
    (uploadId: string): FileUploadInternalState => {
      if (!uploadStates[uploadId]) {
        setUploadStates({ ...uploadStates, [uploadId]: {} });
      }
      return uploadStates[uploadId] ? { ...uploadStates[uploadId] } : {};
    },
    [uploadStates],
  );

  // retrieve a specific state element for a specific upload
  const getStateElementFor = useCallback(
    <T,>(uploadId: string, element: keyof FileUploadInternalState) => {
      const currentState = getCurrentStateFor(uploadId);
      return currentState[element] as T;
    },
    [getCurrentStateFor],
  );

  // whether or not any uploads have errors
  const hasError = useMemo(() => {
    return Object.values(uploadStates).some((state) => state.uploadError);
  }, [uploadStates]);

  const activeUploads = useMemo(
    () => Object.keys(uploadStates),
    [uploadStates],
  );

  // setters for individual states per upload
  const setUploadErrorFor = useCallback(
    (uploadId: string, errorMessage?: string) => {
      const currentState = getCurrentStateFor(uploadId);
      setUploadStates({
        ...uploadStates,
        [uploadId]: { ...currentState, uploadError: errorMessage },
      });
    },
    [uploadStates, getCurrentStateFor],
  );
  const setCurrentStatusFor = useCallback(
    (uploadId: string, currentStatus?: FileUploadProcessStatus) => {
      const currentState = getCurrentStateFor(uploadId);
      setUploadStates({
        ...uploadStates,
        [uploadId]: { ...currentState, currentStatus },
      });
    },
    [uploadStates, getCurrentStateFor],
  );
  const setFileNameFor = useCallback(
    (uploadId: string, fileName: string) => {
      const currentState = getCurrentStateFor(uploadId);
      setUploadStates({
        ...uploadStates,
        [uploadId]: { ...currentState, fileName },
      });
    },
    [uploadStates, getCurrentStateFor],
  );
  const setUploadControllerFor = useCallback(
    (uploadId: string, uploadController: AbortController) => {
      const currentState = getCurrentStateFor(uploadId);
      setUploadStates({
        ...uploadStates,
        [uploadId]: { ...currentState, uploadController },
      });
    },
    [uploadStates, getCurrentStateFor],
  );
  const setPostUploadControllerFor = useCallback(
    (uploadId: string, postUploadController: AbortController) => {
      const currentState = getCurrentStateFor(uploadId);
      setUploadStates({
        ...uploadStates,
        [uploadId]: { ...currentState, postUploadController },
      });
    },
    [uploadStates, getCurrentStateFor],
  );
  const setResponseReaderFor = useCallback(
    (uploadId: string, responseReader: ReadableStreamDefaultReader) => {
      const currentState = getCurrentStateFor(uploadId);
      setUploadStates({
        ...uploadStates,
        [uploadId]: { ...currentState, responseReader },
      });
    },
    [uploadStates, getCurrentStateFor],
  );

  // internal convenience methods
  const abortUploadFor = (uploadId: string) => {
    const currentState = getCurrentStateFor(uploadId);
    currentState.uploadController?.abort();
  };

  const abortPostUploadFor = (uploadId: string) => {
    const currentState = getCurrentStateFor(uploadId);
    currentState.postUploadController?.abort();
  };

  const cancelResponseReaderFor = (uploadId: string) => {
    const currentState = getCurrentStateFor(uploadId);
    void currentState.responseReader?.cancel();
  };

  const readResponseStreamFor = useCallback(
    async (
      uploadId: string,
      reader: ReadableStreamDefaultReader<Uint8Array>,
    ) => {
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
                setCurrentStatusFor(uploadId, "infected");
              }
              error = new Error(payloadJson.error);
            } else if (payloadJson?.status) {
              setCurrentStatusFor(
                uploadId,
                payloadJson.status as FileUploadProcessStatus,
              );
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
    [setCurrentStatusFor],
  );

  const handleErrorFor = useCallback(
    (uploadId: string, e: Error) => {
      onError(e);
      setUploadErrorFor(uploadId, e.message);
    },
    [setUploadErrorFor, onError],
  );

  const cancelUploadFor = (uploadId: string) => {
    setCurrentStatusFor(uploadId);
    abortUploadFor(uploadId);
    abortPostUploadFor(uploadId);
    // fileInputRef.current?.clearFiles();
    cancelResponseReaderFor(uploadId);
  };

  const dismissErrorFor = (uploadId: string) => {
    setCurrentStatusFor(uploadId);
    setUploadErrorFor(uploadId);
    // fileInputRef.current?.clearFiles();
  };

  const performUpload = useCallback(
    (uploadId: string, fileToUpload: File) => {
      // start upload
      void createFormDataForFile(fileToUpload)
        .then((fileFormData) => {
          return clientFetch("/api/file", {
            method: "POST",
            body: fileFormData,
            signal: getCurrentStateFor(uploadId).uploadController?.signal,
          });
        })
        // process streaming response
        .then((response: Response) => {
          const reader = response.body?.getReader();
          setResponseReaderFor(
            uploadId,
            reader as ReadableStreamDefaultReader<Uint8Array>,
          );
          return readResponseStreamFor(
            uploadId,
            reader as ReadableStreamDefaultReader<Uint8Array>,
          );
        })
        // run post upload action
        .then((pendingFileId) => {
          if (!pendingFileId) {
            // note that the missing file id error display is predicated on the timing of
            // an error occurring in the "complete" state
            throw new Error(
              "upload stream completed without sending pending file id",
            );
          }
          const postUploadAbortController = new AbortController();
          setCurrentStatusFor(uploadId, "post-upload");
          setPostUploadControllerFor(uploadId, postUploadAbortController);
          return postUploadAction(
            pendingFileId,
            postUploadAbortController.signal,
          );
        })
        // run complete actions
        .then((postUploadResult: unknown) => {
          // complete status will persist until refresh or form change
          setCurrentStatusFor(uploadId, "success");
          onSuccess(postUploadResult);
          return;
        })
        .catch((e: Error) => {
          handleErrorFor(uploadId, e);
        })
        .finally(() => {
          onComplete();
        });
    },
    [
      clientFetch,
      getCurrentStateFor,
      handleErrorFor,
      onComplete,
      onSuccess,
      postUploadAction,
      readResponseStreamFor,
      setCurrentStatusFor,
      setPostUploadControllerFor,
      setResponseReaderFor,
    ],
  );

  const uploadFile = useCallback(
    (changeEvent: ChangeEvent<HTMLInputElement>) => {
      if (!changeEvent.target.files?.length) {
        console.error("no files!");
        return;
      }
      const fileToUpload = changeEvent.target.files[0];
      const fileName = fileToUpload.name || "No Filename!";
      const uploadId = `${fileName}_${Date.now()}`;
      const uploadAbortController = new AbortController();

      setUploadErrorFor(uploadId, uploadId);
      setFileNameFor(uploadId, fileName);
      setCurrentStatusFor(uploadId, "queued");
      setUploadControllerFor(uploadId, uploadAbortController);

      try {
        onStart();
      } catch (e) {
        handleErrorFor(uploadId, e as Error);
        return;
      }

      performUpload(uploadId, fileToUpload);
    },
    [
      handleErrorFor,
      onStart,
      performUpload,
      setCurrentStatusFor,
      setFileNameFor,
      setUploadControllerFor,
      setUploadErrorFor,
    ],
  );

  return {
    uploadStates,
    uploadFile,
    cancelUploadFor,
    dismissErrorFor,
    getStateElementFor,
    hasError,
    activeUploads,
  };
};
