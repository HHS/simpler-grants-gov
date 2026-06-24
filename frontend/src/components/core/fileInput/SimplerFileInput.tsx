import { noop } from "lodash";
import { useClientFetch } from "src/hooks/useClientFetch";
import { useFileUpload } from "src/hooks/useFileUpload";
import {
  FileUploadProcessStatus,
  FileUploadStatusUpdate,
  PostUploadAction,
  UploadFileMetadata,
} from "src/types/fileUploadTypes";
import { createFormDataForFile } from "src/utils/fileUtils/createFormData";
import { unbatchStreamChunkJSON } from "src/utils/streamUtils";

import { ChangeEvent, useCallback, useMemo, useRef, useState } from "react";
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
  multiFile?: boolean;
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

  * remove the trussworks "selected file" input on single file inputs [x]
  * confirm delete behavior [x]
  * confirm cancel behavior [x]
  * confirm callback behavior [x]
  *
  * confirm error status displays [x]
  *
  * properly format status display [x]
  * properly format existing file display [x]'
  *
  *
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
  multiFile = false,
}: SimplerFileInputProps) => {
  const fileInputRef = useRef<FileInputRef | null>(null);
  const deleteModalRef = useRef<ModalRef | null>(null);

  const {
    uploadFile,
    cancelUploadFor,
    dismissErrorFor,
    getStateElementFor,
    hasError,
    activeUploads,
  } = useFileUpload({
    onStart,
    onSuccess,
    onComplete,
    onError,
    postUploadAction,
  });

  const [filePendingDeletion, setFilePendingDeletion] =
    useState<UploadFileMetadata>();
  const [deletePending, setDeletePending] = useState(false);
  const [filesWithDeleteError, setFilesWithDeleteError] = useState<string[]>(
    [],
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

  // hide the "select file" display if
  //  * there are any existing files and not multifile uploader
  //  * there are currently running uploads that are not in a success or not started state and not multifile uploader
  const hideNativeInput = useMemo(() => {
    if (multiFile) {
      return false;
    }
    if (existingFiles?.length) {
      return true;
    }
    if (
      activeUploads.some((activeUploadId) => {
        const status = getStateElementFor(activeUploadId, "currentStatus");
        return status && status !== "success";
      })
    ) {
      return true;
    }
  }, [multiFile, activeUploads, existingFiles, getStateElementFor]);

  console.log("~~~ active uploads", activeUploads);
  return (
    <>
      <FileInput
        id={id}
        name={id}
        ref={fileInputRef}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        onChange={(e) => uploadFile(e)}
        aria-describedby={labelId}
        aria-invalid={!!hasError}
        className={hideNativeInput ? "display-none" : ""}
        multiple={multiFile}
      />
      {activeUploads.map((activeUploadId) => (
        <FileInputStatusDisplay
          key={activeUploadId}
          fileName={
            getStateElementFor<string>(activeUploadId, "fileName") || ""
          }
          onCancel={() => cancelUploadFor(activeUploadId)}
          onDismiss={() => dismissErrorFor(activeUploadId)}
          error={!!hasError}
          status={getStateElementFor<FileUploadProcessStatus | undefined>(
            activeUploadId,
            "currentStatus",
          )}
          postUploadActionProgressMessage={postUploadActionProgressMessage}
          postUploadActionSuccessMessage={postUploadActionSuccessMessage}
          postUploadActionErrorMessage={postUploadActionErrorMessage}
        />
      ))}
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
