import { noop } from "lodash";
import { useClientFetch } from "src/hooks/useClientFetch";
import {
  FileUploadProcessStatus,
  FileUploadStatusUpdate,
  PostUploadAction,
  UploadFileMetadata,
} from "src/types/fileUploadTypes";

import { ChangeEvent, useCallback, useRef, useState } from "react";
import { FileInput, FileInputRef, ModalRef } from "@trussworks/react-uswds";

import { DeleteFileModal } from "./DeleteFileModal";
import { FileInputExistingFiles } from "./FileInputExistingFiles";
import { FileInputStatusDisplay } from "./FileInputStatusDisplay";

type SimplerFileInputProps = {
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
  * cancel a download [x]
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
    jsonResponse: true,
    authGatedRequest: true,
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
    await responseReader?.cancel();
  };

  const handleDismiss = () => {
    setCurrentStatus(undefined);
    setUploadError(undefined);
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
    (reader: ReadableStreamDefaultReader<string>) => {
      const process = (): Promise<FileUploadProcessStatus> => {
        return reader
          .read()
          .then(({ value, done }) => {
            let payloadJson: FileUploadStatusUpdate;
            try {
              payloadJson = value
                ? (JSON.parse(value) as FileUploadStatusUpdate)
                : {};
            } catch (e) {
              console.error(
                "Error parsing json from file upload stream payload",
              );
              throw e;
            }
            if (payloadJson?.error) {
              throw new Error(payloadJson.error);
            } else {
              setCurrentStatus(payloadJson?.status as FileUploadProcessStatus);
            }
            if (done) {
              return payloadJson?.status as FileUploadProcessStatus;
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
    (changeEvent: ChangeEvent<HTMLInputElement>) => {
      const fileName = changeEvent.target.files?.length
        ? changeEvent.target.files[0].name
        : "No Filename!";
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
        clientFetch(UPLOAD_ENDPOINT, { signal: uploadAbortController.signal })
          // process streaming response
          .then((response: Response) => {
            const reader = response.body?.getReader();
            setResponseReader(reader);
            // this may need to be fixed up if we need to convert the buffer to a string on read, but leaving for now
            return readResponseStream(
              reader as unknown as ReadableStreamDefaultReader<string>,
            );
          })
          // run post upload action
          .then((fileId) => {
            const postUploadAbortController = new AbortController();
            setUploadController(undefined);
            setResponseReader(undefined);
            setCurrentStatus("post-upload");
            setPostUploadController(postUploadAbortController);
            return postUploadAction(fileId, postUploadAbortController.signal);
          })
          // run complete actions
          .then((postUploadResult: unknown) => {
            setPostUploadController(undefined);
            // complete status will persist until refresh or form change
            setCurrentStatus("complete");
            onSuccess(postUploadResult);
            return;
          })
          .catch((e: Error) => {
            handleError(e);
          })
          .finally(() => {
            // may need to clear files from the input here has well?
            setFileName("");
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
