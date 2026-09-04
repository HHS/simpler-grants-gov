import { noop } from "lodash";
import { MAX_UPLOAD_FILE_SIZE_BYTES } from "src/constants/fileUploads";
import { usePrevious } from "src/hooks/usePrevious";
import {
  PostUploadAction,
  UploadFileMetadata,
} from "src/types/fileUploadTypes";

import { ChangeEvent, useCallback, useMemo, useRef, useState } from "react";
import { FileInput, FileInputRef, ModalRef } from "@trussworks/react-uswds";

import { DeleteFileModal } from "./DeleteFileModal";
import { FileInputExistingFiles } from "./FileInputExistingFiles";
import { FileInputStatusDisplay } from "./FileInputStatusDisplay";
import { FileUploadManager } from "./FileUploadManager";

type SimplerFileInputProps = {
  // note that post upload actions must not swallow errors in order to properly
  // trigger error handling logic within this component
  postUploadAction: PostUploadAction;
  postUploadActionProgressMessage: string;
  postUploadActionSuccessMessage?: string;
  postUploadActionErrorMessage?: string;
  deleteActionConfirmationMessage?: string;
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
  // ids of the elements describing this input (label, help text, field errors), combined
  // into one aria-describedby. Required, so a caller cannot silently drop the
  // description - pass an empty array when nothing describes the input.
  describedByIds: string[];
  // set when the form considers the field invalid. Kept separate from upload errors so a
  // later successful upload does not clear a form level validation error.
  formInvalid?: boolean;
  multiFile?: boolean;
  // files larger than this are rejected client side before any request is made.
  // note that this is a UX guard only
  maxFileSizeBytes?: number;
};

export const SimplerFileInput = ({
  postUploadAction,
  postUploadActionProgressMessage,
  postUploadActionSuccessMessage,
  postUploadActionErrorMessage,
  deleteActionConfirmationMessage,
  id,
  describedByIds,
  existingFiles,
  onDelete,
  onStart = noop,
  onSuccess = noop,
  onComplete = noop,
  onError = noop,
  disabled = false,
  readOnly = false,
  required = false,
  formInvalid = false,
  multiFile = false,
  maxFileSizeBytes = MAX_UPLOAD_FILE_SIZE_BYTES,
}: SimplerFileInputProps) => {
  const previousExistingFilesLength = usePrevious(existingFiles?.length);
  // On multifile inputs we don't really need to track the file input, so we clear it out immediately
  // on upload start in order to avoid showing the trussworks "files added" state.
  // On single file input we need to track files added in order to handle cases where multiple uploads
  // are attempted
  const fileInputRef = useRef<FileInputRef | null>(null);
  const deleteModalRef = useRef<ModalRef | null>(null);
  // a counter rather than a timestamp: files selected in one batch would otherwise share
  // an upload id, since Date.now() does not advance between them
  const uploadIdCounter = useRef(0);

  // readOnly is deliberately not forwarded to the native input - it has no effect on
  // <input type="file">, so the control is disabled instead
  const isEditable = !disabled && !readOnly;

  const [filePendingDeletion, setFilePendingDeletion] =
    useState<UploadFileMetadata>();
  const [deletePending, setDeletePending] = useState(false);
  const [filesWithDeleteError, setFilesWithDeleteError] = useState<string[]>(
    [],
  );
  // upload id is only used for tracking internal to this component
  const [activeUploads, setActiveUploads] = useState<
    { uploadId: string; file: File }[]
  >([]);

  const [completedUploads, setCompletedUploads] = useState<string[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const toUploadMetadata = (files: File[]) => {
    return files.map((file) => {
      uploadIdCounter.current += 1;
      return { uploadId: `${file.name}_${uploadIdCounter.current}`, file };
    });
  };

  const trackUpload = (changeEvent: ChangeEvent<HTMLInputElement>) => {
    if (!isEditable) {
      return;
    }
    if (!changeEvent.target.files?.length) {
      console.error("no files!");
      return;
    }

    // log if trying to upload more than one file to a single file input
    // note that this isn't an error - we'll just only accept the first file in the list
    if (!multiFile && changeEvent.target.files.length > 1) {
      console.error(
        "attempting to upload multiple files to a single file input, only uploading first file in list",
      );
    }

    // no-op / early return if single file input and the input already has files in it
    if (!multiFile && fileInputRef.current?.files.length) {
      console.error(
        "attempting to upload additional files to a single file input, not uploading new file",
      );
      return;
    }
    const filesToUpload = !multiFile
      ? [changeEvent.target.files[0]]
      : Array.from(changeEvent.target.files);

    // ids are assigned outside the setter, so a repeated invocation cannot advance the
    // counter; the functional setter keeps rapid selections from clobbering each other
    const newUploads = toUploadMetadata(filesToUpload);
    setActiveUploads((previousActiveUploads) => [
      ...previousActiveUploads,
      ...newUploads,
    ]);
  };

  // this does not update the list of existing / previously uploaded files internally,
  // and relies on the parent to update that list upon successful deletion
  const handleDeleteFile = useCallback(() => {
    if (!isEditable) {
      return;
    }
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
        return;
      })
      .catch((e) => {
        console.error("Error deleting file", e);
        setDeletePending(false);
        setFilePendingDeletion(undefined);
        deleteModalRef.current?.toggleModal();
        setFilesWithDeleteError(
          filesWithDeleteError.concat([filePendingDeletion.id]),
        );
      });
  }, [isEditable, filePendingDeletion, onDelete, filesWithDeleteError]);

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
    if (activeUploads.length || completedUploads.length) {
      return true;
    }
  }, [
    multiFile,
    existingFiles?.length,
    activeUploads.length,
    completedUploads.length,
  ]);

  // note the usage of functional state setters in these functions
  // it's necessary to avoid referencing stale closed over state values up the call stack
  const trackUploadComplete = (uploadId: string) => {
    setCompletedUploads((previousCompletedUploads) => [
      ...previousCompletedUploads,
      uploadId,
    ]);
    setActiveUploads((previousActiveUploads) =>
      previousActiveUploads.filter(
        (activeUpload) => activeUpload.uploadId !== uploadId,
      ),
    );
  };
  const trackUploadCanceled = (uploadId: string) => {
    setActiveUploads((previousActiveUploads) =>
      previousActiveUploads.filter(
        (activeUpload) => activeUpload.uploadId !== uploadId,
      ),
    );
  };
  const trackUploadError = (uploadId: string) => {
    setUploadErrors((previousUploadErrors) => [
      ...previousUploadErrors,
      uploadId,
    ]);
  };

  const dismissError = (uploadId: string) => {
    setUploadErrors((previousUploadErrors) =>
      previousUploadErrors.filter((uploadError) => uploadError !== uploadId),
    );
    // we want to show the upload input again after dismissing a single error
    trackUploadCanceled(uploadId);
    if (!multiFile) {
      fileInputRef?.current?.clearFiles();
    }
  };

  const describedBy = describedByIds.filter(Boolean).join(" ") || undefined;

  // a field that already has files is satisfied, but the chooser itself is always empty -
  // keeping the native flag set would block submission, and for a single file field the
  // chooser is hidden by then, so the browser's message would be unreachable. The label
  // and form schema validation still convey that the field is required.
  const nativeRequired = required && !existingFiles?.length;

  if (
    (previousExistingFilesLength || 0) !== existingFiles?.length &&
    completedUploads.length
  ) {
    setCompletedUploads([]);
  }

  return (
    <>
      <FileInput
        id={id}
        name={id}
        ref={fileInputRef}
        required={nativeRequired}
        disabled={!isEditable}
        onChange={(e) => {
          trackUpload(e);
        }}
        aria-describedby={describedBy}
        aria-invalid={formInvalid || !!uploadErrors.length}
        className={hideNativeInput ? "display-none" : ""}
        multiple={multiFile}
        changeSelectedFileText="Add file"
      />
      {completedUploads.map((completedUploadFilename) => (
        <FileInputStatusDisplay
          key={completedUploadFilename}
          fileName={completedUploadFilename}
          status="success"
          postUploadActionProgressMessage={postUploadActionProgressMessage}
          postUploadActionSuccessMessage={postUploadActionSuccessMessage}
          postUploadActionErrorMessage={postUploadActionErrorMessage}
          maxFileSizeBytes={maxFileSizeBytes}
          error={false}
          onCancel={() => {}}
          onDismiss={() => {}}
        />
      ))}
      {activeUploads.map(({ uploadId, file }) => (
        <FileUploadManager
          key={uploadId}
          fileToUpload={file}
          onCancel={() => {
            trackUploadCanceled(uploadId);
            if (!multiFile) {
              fileInputRef?.current?.clearFiles();
            }
          }}
          onDismiss={() => {
            dismissError(uploadId);
          }}
          postUploadActionProgressMessage={postUploadActionProgressMessage}
          postUploadActionSuccessMessage={postUploadActionSuccessMessage}
          postUploadActionErrorMessage={postUploadActionErrorMessage}
          onStart={() => {
            // we never want to show the "files added" state of the trussworks input
            if (multiFile) {
              fileInputRef?.current?.clearFiles();
            }
            onStart();
          }}
          onUploadSuccess={(postUploadResult: unknown) => {
            trackUploadComplete(uploadId);
            onSuccess(postUploadResult);
            if (!multiFile) {
              fileInputRef?.current?.clearFiles();
            }
          }}
          onComplete={onComplete}
          onUploadError={(e: Error) => {
            onError(e);
            trackUploadError(uploadId);
          }}
          postUploadAction={postUploadAction}
          maxFileSizeBytes={maxFileSizeBytes}
        />
      ))}
      <FileInputExistingFiles
        existingFiles={existingFiles}
        onDelete={(fileToDelete: UploadFileMetadata) => {
          setFilePendingDeletion(fileToDelete);
          deleteModalRef.current?.toggleModal();
        }}
        filesWithDeleteError={filesWithDeleteError}
        disabled={disabled || readOnly}
      />
      {/* not rendered when locked or read only, so the delete confirmation cannot be
          reached by pointer or keyboard */}
      {isEditable && (
        <DeleteFileModal
          // note that this only supports deleting one file at a time.
          deletePending={deletePending}
          handleDeleteFile={handleDeleteFile}
          modalId={`${id}-delete-file-modal`}
          modalRef={deleteModalRef}
          pendingDeleteName={filePendingDeletion?.fileName}
          confirmationMessage={deleteActionConfirmationMessage}
        />
      )}
    </>
  );
};
