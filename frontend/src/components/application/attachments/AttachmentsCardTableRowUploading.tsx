import { AttachmentCardItem } from "src/types/attachmentTypes";

import { useTranslations } from "next-intl";

import Spinner from "src/components/Spinner";

interface Props {
  attachment: AttachmentCardItem;
  onCancel: (id: string) => void;
}

export const AttachmentsCardTableRowUploading = ({
  attachment,
  onCancel,
}: Props) => {
  const t = useTranslations("Application.attachments");

  return (
    <tr className="highlight" key={attachment.id}>
      <td>
        <Spinner className="sm" />
        {attachment.file.name}
      </td>
      <td colSpan={3}>
        <button
          type="button"
          className="usa-button usa-button--unstyled margin-left-2"
          onClick={() => onCancel(attachment.id)}
        >
          {t("cancelUpload")}
        </button>
      </td>
    </tr>
  );
};
