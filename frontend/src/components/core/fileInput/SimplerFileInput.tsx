import { noop } from "lodash";
import { useClientFetch } from "src/hooks/useClientFetch";
import {
  FileUploadProcessStatus,
  FileUploadStatusUpdate,
  PostUploadAction,
  UploadFileMetadata,
} from "src/types/fileUploadTypes";
import { createFormDataForFile } from "src/utils/fileUtils/createFormData";
import { unbatchStreamChunkJSON } from "src/utils/streamUtils";

import { ChangeEvent, useCallback, useRef, useState } from "react";
import { FileInput, FileInputRef, ModalRef } from "@trussworks/react-uswds";

import { DeleteFileModal } from "./DeleteFileModal";
import { FileInputExistingFiles } from "./FileInputExistingFiles";
import { FileInputStatusDisplay } from "./FileInputStatusDisplay";

type SimplerFileInputProps = {
  // note that post upload actions must not swallow errors in order to properly
  // trigger error handling logic within this component
  postUploadAction: PostUploadAction;
  postUploadActionProgressMessage: string;
  postUploadActionSuccessMessage?: string;
  postUploadActionErrorMessage?: string;
  onDelete: (fileId: string) => Promise<unknown>; // what should the delete callback return? do we need to dynamically type this?
  onError?: (err: Error) => void;
  onSuccess?: (postUploadResult: unknown) => void;
  onStart?: () => void;
  onComplete?: () => void;
  id: string;
  existingFiles?: UploadFileMetadata[];
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  labelId: string;
};

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
  * cancel a download [x]
  * delete a previously uploaded file [x]

  * remove the "selected file" thing on single file inputs [x]
  * confirm delete behavior [x]
  * confirm cancel behavior [x]
  * confirm callback behavior [x]
  *
  * confirm error status displays [x]
  *
  * properly format status display [x]
  * properly format existing file display [x]
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
  onStart = noop,
  onSuccess = noop,
  onComplete = noop,
  onError = noop,
  disabled = false,
  readOnly = false,
  required = false,
}: SimplerFileInputProps) => {
  const fileInputRef = useRef<FileInputRef | null>(null);
  const deleteModalRef = useRef<ModalRef | null>(null);

  const { clientFetch } = useClientFetch<Response>("unable to upload file", {
    authGatedRequest: true,
    jsonResponse: false,
  });

  const [uploadError, setUploadError] = useState<
    { status: FileUploadProcessStatus | undefined; message: string } | undefined
  >();
  const [currentStatus, setCurrentStatus] = useState<FileUploadProcessStatus>();
  const [fileName, setFileName] = useState<string>();
  const [uploadController, setUploadController] = useState<AbortController>();
  const [postUploadController, setPostUploadController] =
    useState<AbortController>();
  const [responseReader, setResponseReader] =
    useState<ReadableStreamDefaultReader>();
  const [filePendingDeletion, setFilePendingDeletion] =
    useState<UploadFileMetadata>();
  const [deletePending, setDeletePending] = useState(false);
  const [filesWithDeleteError, setFilesWithDeleteError] = useState<string[]>(
    [],
  );

  const handleCancel = async () => {
    setCurrentStatus(undefined);
    uploadController?.abort();
    postUploadController?.abort();
    fileInputRef.current?.clearFiles();
    await responseReader?.cancel();
  };

  const handleDismiss = () => {
    setCurrentStatus(undefined);
    setUploadError(undefined);
    fileInputRef.current?.clearFiles();
  };

  const handleError = useCallback(
    (e: Error) => {
      onError(e);
      setUploadError({ status: currentStatus, message: e.message });
    },
    [currentStatus, setUploadError, onError],
  );

  // this does not update the list of existing / previously uploaded files internally,
  // and relies on the parent to update that list upon successful deletion
  const handleDeleteFile = useCallback(() => {
    if (!filePendingDeletion) {
      console.error("Attempting to delete, but no file selected");
      return;
    }
    setDeletePending(true);
    onDelete(filePendingDeletion?.id)
      .then(() => {
        setDeletePending(false);
        setFilePendingDeletion(undefined);
        deleteModalRef.current?.toggleModal();
        fileInputRef.current?.clearFiles();
        // figured we may need to clear delete errors for the file here, but it should
        // be removed from the dom on successful delete so I don't think it's necessary
        return;
      })
      .catch((e) => {
        // do we want to do anything else here to surface the error?
        console.error("Error deleting file", e);
        setDeletePending(false);
        setFilePendingDeletion(undefined);
        deleteModalRef.current?.toggleModal();
        setFilesWithDeleteError(
          filesWithDeleteError.concat([filePendingDeletion.id]),
        );
      });
  }, [filePendingDeletion, onDelete, filesWithDeleteError]);

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

  const onFileSelect = useCallback(
    (changeEvent: ChangeEvent<HTMLInputElement>) => {
      if (!changeEvent.target.files?.length) {
        console.error("no files!");
        return;
      }
      setUploadError(undefined);
      const fileName = changeEvent.target.files[0].name || "No Filename!";
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
      return (
        createFormDataForFile(changeEvent.target.files[0])
          .then((fileFormData) => {
            return clientFetch("/api/file", {
              method: "POST",
              body: fileFormData,
              signal: uploadAbortController.signal,
            });
          })
          // process streaming response
          .then((response: Response) => {
            const reader = response.body?.getReader();
            setResponseReader(reader);
            return readResponseStream(
              reader as ReadableStreamDefaultReader<Uint8Array>,
            );
          })
          // run post upload action
          .then((pendingFileId: string) => {
            if (!pendingFileId) {
              // note that the missing file id error display is predicated on the timing of
              // an error occurring in the "complete" state
              throw new Error(
                "upload stream completed without sending pending file id",
              );
            }
            const postUploadAbortController = new AbortController();
            setUploadController(undefined);
            setResponseReader(undefined);
            setCurrentStatus("post-upload");
            setPostUploadController(postUploadAbortController);
            return postUploadAction(
              pendingFileId,
              postUploadAbortController.signal,
            );
          })
          // run complete actions
          .then((postUploadResult: unknown) => {
            setPostUploadController(undefined);
            // complete status will persist until refresh or form change
            setCurrentStatus("success");
            onSuccess(postUploadResult);
            return;
          })
          .catch((e: Error) => {
            handleError(e);
          })
          .finally(() => {
            setPostUploadController(undefined);
            setUploadController(undefined);
            setResponseReader(undefined);
            onComplete();
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
      onComplete,
    ],
  );

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
        className={
          (currentStatus && currentStatus !== "success") ||
          existingFiles?.length
            ? "display-none"
            : ""
        }
      />
      {currentStatus ? (
        <FileInputStatusDisplay
          fileName={fileName || ""}
          onCancel={() => void handleCancel()}
          onDismiss={handleDismiss}
          error={!!uploadError}
          status={currentStatus}
          postUploadActionProgressMessage={postUploadActionProgressMessage}
          postUploadActionSuccessMessage={postUploadActionSuccessMessage}
          postUploadActionErrorMessage={postUploadActionErrorMessage}
        />
      ) : null}
      <FileInputExistingFiles
        existingFiles={existingFiles}
        onDelete={(fileToDelete: UploadFileMetadata) => {
          setFilePendingDeletion(fileToDelete);
          deleteModalRef.current?.toggleModal();
        }}
        filesWithDeleteError={filesWithDeleteError}
      />
      <DeleteFileModal
        // this only supports deleting one file at a time.
        // in order to support deleting more than one file at a time we'd
        // need to switch things up a bit, and I don't know if that's a requirement
        deletePending={deletePending}
        handleDeleteFile={handleDeleteFile}
        modalId={`${id}-delete-file-modal`}
        modalRef={deleteModalRef}
        pendingDeleteName={filePendingDeletion?.fileName}
      />
    </>
  );
};
