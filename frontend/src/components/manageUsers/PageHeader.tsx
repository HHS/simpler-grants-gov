import { useTranslations } from "next-intl";

export const PageHeader = ({
  organizationName,
}: {
  organizationName?: string;
}) => {
  const t = useTranslations("ManageUsers");
  return (
    <h1 className="margin-bottom-6 margin-top-4 font-sans-2xl">
      {organizationName && (
        <span className="margin-bottom-2 margin-top-0 font-sans-lg display-block">
          {organizationName}
        </span>
      )}
      {t("pageHeading")}
    </h1>
  );
};
