import { RefObject } from "react";
import { FileInput, FileInputRef } from "@trussworks/react-uswds";

interface Props {
  applicationId: string;
  errorText?: string;
  handleUploadAttachment: (files: FileList | null) => void;
  inputRef: RefObject<FileInputRef | null>;
}

export const AttachmentsCardForm = ({
  applicationId,
  errorText,
  handleUploadAttachment,
  inputRef,
}: Props) => {
  return (
    <>
      <input type="hidden" name="application_id" value={applicationId} />
      <FileInput
        id="application-attachment-upload"
        name="application-attachment-upload"
        errorText={errorText}
        onChange={(e) => {
          const files = e.currentTarget.files;
          e.preventDefault();
          handleUploadAttachment(files || null);
        }}
        onDrop={(e) => {
          const files = e.dataTransfer.files;
          e.preventDefault();
          handleUploadAttachment(files);
        }}
        ref={inputRef}
      />
    </>
  );
};
