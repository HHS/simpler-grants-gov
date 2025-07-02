import { useTranslations } from "next-intl";

export const NoAttachmentsEmptyTableRow = () => {
  const t = useTranslations("Application.attachments");
  return (
    <tr>
      <td colSpan={4}>{t("emptyTable")}</td>
    </tr>
  );
};
