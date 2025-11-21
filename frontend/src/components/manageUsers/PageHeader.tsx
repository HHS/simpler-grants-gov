import { useTranslations } from "next-intl";

export const PageHeader = ({
  organizationName,
}: {
  organizationName?: string;
}) => {
  const t = useTranslations("ManageUsers");
  return (
    <h1 className="margin-bottom-05 font-sans-2xl">
      {organizationName && (
        <span className="margin-bottom-3 margin-top-0 font-sans-lg display-block">
          {organizationName}
        </span>
      )}
      {t("pageHeading")}
    </h1>
  );
};
