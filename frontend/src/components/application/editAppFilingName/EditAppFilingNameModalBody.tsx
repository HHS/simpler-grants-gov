import { useTranslations } from "next-intl";

export const EditAppFilingNameModalBody = ({
  opportunityName,
}: {
  opportunityName: string | null;
}) => {
  const t = useTranslations(
    "Application.information.editApplicationFilingNameModal",
  );

  return (
    <>
      <p className="text-bold">
        {t("appliedFor")}
        {opportunityName}
      </p>
      <p className="margin-top-0 font-sans-3xs">{t("fieldRequirements")}</p>
    </>
  );
};
