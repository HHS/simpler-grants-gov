import { useTranslations } from "next-intl";

import Spinner from "src/components/Spinner";

export const AttachmentsCardTableRowDeleting = () => {
  const t = useTranslations("Application.attachments.deleteModal");
  return (
    <tr className="highlight">
      <td colSpan={4}>
        <Spinner className="sm" />
        {t("deleting")}
      </td>
    </tr>
  );
};
