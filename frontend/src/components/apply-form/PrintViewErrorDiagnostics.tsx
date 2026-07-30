import { useTranslations } from "next-intl";

/*
 * Known getFormData error categories:
 * - NotFound means the application or application form could not be found for
 *   the route IDs.
 * - UnauthorizedError means the request did not have usable authentication.
 * - TopLevelError broadly covers form-data loading or preparation failures
 *   before PrintForm renders.
 * - UnknownError is the safe fallback when form data is missing without a
 *   returned error category.
 *
 * `hasInternalToken` only indicates that the internal-token header was present;
 * it does not mean the token was valid. Widget or render-time failures after
 * PrintForm starts rendering are outside this fallback and would require
 * separate error-boundary handling.
 */
type PrintViewErrorCategory =
  "TopLevelError" | "NotFound" | "UnauthorizedError" | "UnknownError";

interface PrintViewErrorDiagnosticsProps {
  applicationId: string;
  applicationFormId: string;
  errorCategory: PrintViewErrorCategory;
  hasInternalToken: boolean;
}

/**
 * Displays safe diagnostic details when the print page cannot load or prepare
 * form data. This fallback renders before PrintForm and does not handle errors
 * thrown while rendering PrintForm or its widgets.
 */
export default function PrintViewErrorDiagnostics({
  applicationId,
  applicationFormId,
  errorCategory,
  hasInternalToken,
}: PrintViewErrorDiagnosticsProps) {
  const translate = useTranslations("PrintViewErrorDiagnostics");
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
              <th scope="row">
                {translate("internalTokenHeaderPresentLabel")}
              </th>
              <td>{hasInternalToken ? translate("yes") : translate("no")}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
