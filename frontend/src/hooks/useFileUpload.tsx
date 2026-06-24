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

type FileUploadInputs = FileUploadCallbacks & { file: File; uploadId?: string };

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
  onError = noop,
  onComplete = noop,
  postUploadAction,
}: FileUploadInputs) => {
  const { clientFetch } = useClientFetch<Response>("unable to upload file", {
    authGatedRequest: true,
    jsonResponse: false,
  });
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
      onError(e);
      setUploadError(e.message);
    },
    [setUploadError, onError],
  );

  const handleCancel = async () => {
    setCurrentStatus(undefined);
    uploadController?.abort();
    postUploadController?.abort();
    await responseReader?.cancel();
  };

  const handleDismiss = () => {
    setCurrentStatus(undefined);
    setUploadError(undefined);
  };

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

  const performUpload = useCallback(
    (fileToUpload: File) => {
      // start upload
      void createFormDataForFile(fileToUpload)
        .then((fileFormData) => {
          return clientFetch("/api/file", {
            method: "POST",
            body: fileFormData,
            signal: uploadController?.signal,
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
              "upload stream completed without sending pending file id",
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
      uploadController,
      onComplete,
      onSuccess,
      postUploadAction,
      readResponseStream,
      setCurrentStatus,
      setPostUploadController,
      setResponseReader,
    ],
  );

  const uploadFile = useCallback(
    (changeEvent: ChangeEvent<HTMLInputElement>) => {
      // if (!changeEvent.target.files?.length) {
      //   console.error("no files!");
      //   return;
      // }
      // const fileToUpload = changeEvent.target.files[0];
      const fileName = fileToUpload.name || "No Filename!";
      const uploadId = `${fileName}_${Date.now()}`;
      const uploadAbortController = new AbortController();

      setUploadError(uploadId);
      setFileName(fileName);
      setCurrentStatus("queued");
      setUploadController(uploadAbortController);

      try {
        onStart();
      } catch (e) {
        handleError(e as Error);
        return;
      }

      performUpload(fileToUpload);
    },
    [
      handleError,
      onStart,
      performUpload,
      setCurrentStatus,
      setFileName,
      setUploadController,
      setUploadError,
    ],
  );
  return {
    uploadError,
    currentStatus,
    fileName,
    uploadFile,
    handleCancel,
    handleDismiss,
  };
};

// export const useFileUpload = ({
//   onStart = noop,
//   onSuccess = noop,
//   onComplete = noop,
//   onError = noop,
//   postUploadAction,
// }: FileUploadCallbacks) => {
//   // const { clientFetch } = useClientFetch<Response>("unable to upload file", {
//   //   authGatedRequest: true,
//   //   jsonResponse: false,
//   // });

//   // full state
//   const [uploadStates, setUploadStates] = useState<
//     Record<string, FileUploadInternalState>
//   >({});

//   // const updateStateFor = (uploadId) => (key, value) => {

//   //         setUploadStates({
//   //       ...uploadStates,
//   //       [uploadId]: { ...currentState, [key]: value },
//   //     });
//   // }

//   // create or return current state for a given upload
//   const getCurrentStateFor = useCallback(
//     (uploadId: string): FileUploadInternalState => {
//       // console.log("~~~~ currentState", uploadStates);
//       // if (!uploadStates[uploadId]) {
//       //   console.log("~~~~ setting currentState", {
//       //     ...uploadStates,
//       //     [uploadId]: {},
//       //   });
//       //   setUploadStates({ ...uploadStates, [uploadId]: {} });
//       // }
//       // console.log("~ds~ 1. uploadId", uploadId);
//       console.log("~ds~ 2. reading currentState", uploadStates[uploadId]);
//       return uploadStates[uploadId] ? { ...uploadStates[uploadId] } : {};
//     },
//     [uploadStates],
//   );

//   // retrieve a specific state element for a specific upload
//   const getStateElementFor = useCallback(
//     <T,>(uploadId: string, element: keyof FileUploadInternalState) => {
//       const currentState = getCurrentStateFor(uploadId);

//       return currentState[element] as T;
//     },
//     [getCurrentStateFor],
//   );

//   // whether or not any uploads have errors
//   const hasError = useMemo(() => {
//     return Object.values(uploadStates).some((state) => state.uploadError);
//   }, [uploadStates]);

//   const activeUploads = useMemo(
//     () => Object.keys(uploadStates),
//     [uploadStates],
//   );

//   // setters for individual states per upload
//   // "uploadStates" is stale in setters because the version of the setter functions used in the upload
//   // functions do not update over the course of the function runtime
//   const setUploadErrorFor = useCallback(
//     (uploadId: string, errorMessage?: string) => {
//       console.log("hihihi upload error", uploadStates);
//       const currentState = getCurrentStateFor(uploadId);
//       setUploadStates({
//         ...uploadStates,
//         [uploadId]: { ...currentState, uploadError: errorMessage },
//       });
//     },
//     [uploadStates, getCurrentStateFor],
//   );
//   const setCurrentStatusFor = useCallback(
//     (uploadId: string, currentStatus?: FileUploadProcessStatus) => {
//       console.log("hihihi current status", uploadStates);
//       const currentState = getCurrentStateFor(uploadId);
//       setUploadStates({
//         ...uploadStates,
//         [uploadId]: { ...currentState, currentStatus },
//       });
//     },
//     [uploadStates, getCurrentStateFor],
//   );
//   const setFileNameFor = useCallback(
//     (uploadId: string, fileName: string) => {
//       console.log("hihihi file name", uploadStates);
//       const currentState = getCurrentStateFor(uploadId);
//       setUploadStates({
//         ...uploadStates,
//         [uploadId]: { ...currentState, fileName },
//       });
//     },
//     [uploadStates, getCurrentStateFor],
//   );
//   const setUploadControllerFor = useCallback(
//     (uploadId: string, uploadController: AbortController) => {
//       console.log("hihihi upload controller", uploadStates);
//       const currentState = getCurrentStateFor(uploadId);
//       setUploadStates({
//         ...uploadStates,
//         [uploadId]: { ...currentState, uploadController },
//       });
//     },
//     [uploadStates, getCurrentStateFor],
//   );
//   const setPostUploadControllerFor = useCallback(
//     (uploadId: string, postUploadController: AbortController) => {
//       console.log("hihihi post upload controller", uploadStates);
//       const currentState = getCurrentStateFor(uploadId);
//       setUploadStates({
//         ...uploadStates,
//         [uploadId]: { ...currentState, postUploadController },
//       });
//     },
//     [uploadStates, getCurrentStateFor],
//   );
//   const setResponseReaderFor = useCallback(
//     (uploadId: string, responseReader: ReadableStreamDefaultReader) => {
//       console.log("hihihi response reader", uploadStates);
//       const currentState = getCurrentStateFor(uploadId);
//       setUploadStates({
//         ...uploadStates,
//         [uploadId]: { ...currentState, responseReader },
//       });
//     },
//     [uploadStates, getCurrentStateFor],
//   );

//   // internal convenience methods
//   const abortUploadFor = (uploadId: string) => {
//     const currentState = getCurrentStateFor(uploadId);
//     currentState.uploadController?.abort();
//   };

//   const abortPostUploadFor = (uploadId: string) => {
//     const currentState = getCurrentStateFor(uploadId);
//     currentState.postUploadController?.abort();
//   };

//   const cancelResponseReaderFor = (uploadId: string) => {
//     const currentState = getCurrentStateFor(uploadId);
//     void currentState.responseReader?.cancel();
//   };

//   // // exposed methods for upload management
//   // const handleErrorFor = useCallback(
//   //   (uploadId: string, e: Error) => {
//   //     onError(e);
//   //     setUploadErrorFor(uploadId, e.message);
//   //   },
//   //   [setUploadErrorFor, onError],
//   // );

//   const cancelUploadFor = (uploadId: string) => {
//     setCurrentStatusFor(uploadId);
//     abortUploadFor(uploadId);
//     abortPostUploadFor(uploadId);
//     // fileInputRef.current?.clearFiles();
//     cancelResponseReaderFor(uploadId);
//   };

//   const dismissErrorFor = (uploadId: string) => {
//     setCurrentStatusFor(uploadId);
//     setUploadErrorFor(uploadId);
//     // fileInputRef.current?.clearFiles();
//   };

//   console.log("!!!! state", uploadStates);
//   return {
//     uploadStates,
//     uploadFile,
//     cancelUploadFor,
//     dismissErrorFor,
//     getStateElementFor,
//     hasError,
//     activeUploads,
//   };
// };
