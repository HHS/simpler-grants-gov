import { useTranslations } from "next-intl";

interface PrintErrorDiagnosticsProps {
  applicationId: string;
  applicationFormId: string;
  errorCategory: "TopLevelError" | "NotFound" | "UnauthorizedError";
  hasInternalToken: boolean;
}

export default function PrintErrorDiagnostics({
  applicationId,
  applicationFormId,
  errorCategory,
  hasInternalToken,
}: PrintErrorDiagnosticsProps) {
  const translate = useTranslations("PrintErrorDiagnostics");
  const supportEmail = translate("supportEmail");
  const supportUnitedStatesPhone = translate("supportUnitedStatesPhone");
  const supportUnitedStatesPhoneNumber = supportUnitedStatesPhone.replace(
    /[^\d+-]/g,
    "",
  );
  const supportInternationalPhone = translate("supportInternationalPhone");
  const supportInternationalPhoneNumber = supportInternationalPhone.replace(
    /[^\d+-]/g,
    "",
  );

  return (
    <main>
      <h1>{translate("heading")}</h1>

      <p>{translate("description")}</p>

      <p>{translate("supportInstructions")}</p>

      <section aria-labelledby="support-center-heading">
        <h2 id="support-center-heading">{translate("supportCenterHeading")}</h2>

        <p>{translate("supportAvailability")}</p>

        <p>
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
        </p>

        <p>
          <a href={`tel:${supportUnitedStatesPhoneNumber}`}>
            {supportUnitedStatesPhone}
          </a>
        </p>

        <p>
          <a href={`tel:${supportInternationalPhoneNumber}`}>
            {supportInternationalPhone}
          </a>
        </p>
      </section>

      <section aria-labelledby="diagnostic-details-heading">
        <h2 id="diagnostic-details-heading">
          {translate("diagnosticDetailsHeading")}
        </h2>

        <table>
          <tbody>
            <tr>
              <th scope="row">{translate("applicationIdLabel")}</th>
              <td>{applicationId}</td>
            </tr>
            <tr>
              <th scope="row">{translate("applicationFormIdLabel")}</th>
              <td>{applicationFormId}</td>
            </tr>
            <tr>
              <th scope="row">{translate("errorCategoryLabel")}</th>
              <td>{errorCategory}</td>
            </tr>
            <tr>
              <th scope="row">{translate("internalTokenPresentLabel")}</th>
              <td>{hasInternalToken ? translate("yes") : translate("no")}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
