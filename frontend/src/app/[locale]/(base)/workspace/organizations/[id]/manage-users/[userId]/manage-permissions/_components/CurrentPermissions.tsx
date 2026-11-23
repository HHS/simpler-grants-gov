import { useTranslations } from "next-intl";

export const CurrentPermissions = ({ roleName }: { roleName: string }) => {
  const t = useTranslations("ManagePermissions.currentPermissions");

  const permissionItems = [
    {
      label: t("applicationsLabel"),
      description: t("applicationsDescription"),
    },
    { label: t("formsLabel"), description: t("formsDescription") },
    {
      label: t("savedOpportunitiesLabel"),
      description: t("savedOpportunitiesDescription"),
    },
  ];

  return (
    <section
      id="current-permissions"
      tabIndex={-1}
      data-testid="current-permissions"
    >
      <h2 className="font-sans-xl margin-top-0 margin-bottom-2">
        {t("heading")}
      </h2>
      <p className="font-sans-md margin-top-0 margin-bottom-5">
        {t.rich("roleSummary", {
          roleName,
          strong: (chunks) => <strong>{chunks}</strong>,
        })}
      </p>
      <p className="maxw-tablet-lg">
        {t.rich("description", {
          strong: (chunks) => <strong>{chunks}</strong>,
        })}
      </p>
      <ul className="usa-list usa-list--unstyled margin-0">
        {permissionItems.map(({ label, description }) => (
          <li key={label} className="margin-top-3 maxw-full">
            <span className="text-bold display-block">{label}</span>
            <span className="display-block">{description}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};
