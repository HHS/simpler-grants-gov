import { formatDate } from "src/utils/dateUtil";

import { useTranslations } from "next-intl";

export const useFormatHistoryDate = () => {
  const t = useTranslations("OpportunityListing.history");

  return (date: string | null) => (date ? formatDate(date) : t("notSpecified"));
};

export const OpportunityHistoryItem = ({
  title,
  content,
  description,
}: {
  title: string;
  content: string;
  description?: string | null;
}) => {
  return (
    <li className="margin-y-1">
      <span className="text-bold text-no-wrap">{title}:</span>{" "}
      <span>{content}</span>
      {description && <p className="margin-bottom-0">{description}</p>}
    </li>
  );
};
