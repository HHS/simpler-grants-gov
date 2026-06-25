import { noop } from "lodash";
import {
  PostUploadAction,
  UploadFileMetadata,
} from "src/types/fileUploadTypes";

import { ChangeEvent, useCallback, useMemo, useRef, useState } from "react";
import { FileInput, FileInputRef, ModalRef } from "@trussworks/react-uswds";

import { DeleteFileModal } from "./DeleteFileModal";
import { FileInputExistingFiles } from "./FileInputExistingFiles";
import { FileUploadManager } from "./FileUploadManager";

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

const toUploadMetadata = (files: File[]) => {
  return files.map((file) => {
    const uploadId = `${file.name}_${Date.now()}`;
    return { uploadId, file };
  });
};

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

  const [filePendingDeletion, setFilePendingDeletion] =
    useState<UploadFileMetadata>();
  const [deletePending, setDeletePending] = useState(false);
  const [filesWithDeleteError, setFilesWithDeleteError] = useState<string[]>(
    [],
  );
  // upload id is only used for tracking internal to this component
  const [activeUploads, setActiveUploads] = useState<
    { uploadId: string; file: File; complete?: boolean }[]
  >([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  // track this to ensure we're showing the input at the right times
  const [completedUploads, setCompletedUploads] = useState<string[]>([]);

  const trackUpload = (changeEvent: ChangeEvent<HTMLInputElement>) => {
    if (!changeEvent.target.files?.length) {
      console.error("no files!");
      return;
    }

    if (!multiFile && changeEvent.target.files.length > 1) {
      console.error(
        "attempting to upload multiple files to a single file input, only uploading first file in list",
      );
    }
    if (!multiFile && fileInputRef.current?.files.length) {
      console.error(
        "attempting to upload additional files to a single file input, not uploading new file",
      );
      return;
    }
    const filesToUpload = !multiFile
      ? [changeEvent.target.files[0]]
      : Array.from(changeEvent.target.files);

    setActiveUploads([...activeUploads, ...toUploadMetadata(filesToUpload)]);
  };

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
    // if there is any active upload that has not yet completed
    if (activeUploads.some((activeUpload) => !activeUpload.complete)) {
      return true;
    }
  }, [multiFile, activeUploads, existingFiles]);

  const trackUploadSuccess = (uploadId: string) => {
    const currentUploads = [...activeUploads];
    const completedIndex = currentUploads.findIndex(
      (item) => item.uploadId === uploadId,
    );
    if (completedIndex > -1) {
      currentUploads[completedIndex].complete = true;
      setActiveUploads(currentUploads);
    }
  };
  const trackUploadError = (uploadId: string) => {
    setUploadErrors([...uploadErrors, uploadId]);
  };

  const dismissError = (uploadId: string) => {
    const currentErrors = [...uploadErrors];
    const errorIndex = currentErrors.indexOf(uploadId);
    if (errorIndex > -1) {
      currentErrors.splice(errorIndex, 1);
      setUploadErrors(currentErrors);
    }
  };
  // remove cancelled uploads from the list
  const trackUploadCancel = (uploadId: string) => {
    const currentUploads = [...activeUploads];
    const canceledIndex = currentUploads.findIndex(
      (item) => item.uploadId === uploadId,
    );
    if (canceledIndex > -1) {
      currentUploads.splice(canceledIndex, 1);
      setActiveUploads(currentUploads);
    }
  };

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
          trackUpload(e);
        }}
        aria-describedby={labelId}
        aria-invalid={!!uploadErrors.length}
        className={hideNativeInput ? "display-none" : ""}
        multiple={multiFile}
        changeSelectedFileText="Add file"
      />
      {activeUploads.map(({ uploadId, file }) => (
        <FileUploadManager
          key={uploadId}
          fileToUpload={file}
          uploadId={uploadId}
          onCancel={() => {
            trackUploadCancel(uploadId);
            if (!multiFile) {
              fileInputRef?.current?.clearFiles();
            }
          }}
          onDismiss={() => dismissError(uploadId)}
          postUploadActionProgressMessage={postUploadActionProgressMessage}
          postUploadActionSuccessMessage={postUploadActionSuccessMessage}
          postUploadActionErrorMessage={postUploadActionErrorMessage}
          onStart={onStart}
          onUploadSuccess={(postUploadResult: unknown) => {
            trackUploadSuccess(uploadId);
            onSuccess(postUploadResult);
          }}
          onComplete={onComplete}
          onUploadError={(e: Error) => {
            trackUploadError(uploadId);
            onError(e);
          }}
          postUploadAction={postUploadAction}
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
