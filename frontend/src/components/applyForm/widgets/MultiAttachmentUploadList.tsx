import { useApplicationAttachments } from "src/hooks/ApplicationAttachments";

import { Icon } from "@trussworks/react-uswds";

import { UploadedFile } from "src/components/applyForm/types";

interface Props {
  handleRemove: (index: number) => void;
  uploadedFiles: UploadedFile[];
  readOnly?: boolean;
}

export const MultipleAttachmentUploadList = ({
  handleRemove,
  uploadedFiles,
  readOnly,
}: Props) => {
  const { attachments } = useApplicationAttachments();
  return (
    <ul className="usa-list usa-list--unstyled margin-top-2">
      {uploadedFiles.map((file, index) => {
        const attachment = attachments?.find(
          (a) => a.application_attachment_id === file.id,
        );
        const isPreviouslyUploaded = file.name === "(Previously uploaded file)";

        return (
          <li
            key={`${file.id}-${index}`}
            className="margin-bottom-1 display-flex flex-align-center"
          >
            {attachment?.download_path ? (
              <a
                href={attachment.download_path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary display-inline-flex align-items-center"
              >
                <Icon.Visibility
                  className="margin-right-02 text-middle"
                  role="presentation"
                />
                {file.name}
              </a>
            ) : (
              <span>{file.name}</span>
            )}
            <button
              type="button"
              disabled={readOnly}
              className="usa-button usa-button--unstyled text-primary margin-left-2 display-inline-flex align-items-center"
              onClick={() => handleRemove(index)}
            >
              <Icon.Delete
                className="margin-right-02 text-middle"
                role="presentation"
              />
              {isPreviouslyUploaded ? "Remove" : "Delete"}
            </button>
          </li>
        );
      })}
    </ul>
  );
};
