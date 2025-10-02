import { SamGovEntity } from "src/types/applicationResponseTypes";

import { useTranslations } from "next-intl";
import { Grid } from "@trussworks/react-uswds";

export const OrganizationInfo = ({
  organizationDetails,
}: {
  organizationDetails: SamGovEntity;
}) => {
  const t = useTranslations("OrganizationDetail");
  const {
    ebiz_poc_email,
    ebiz_poc_first_name,
    ebiz_poc_last_name,
    expiration_date,
    uei,
  } = organizationDetails;
  return (
    <>
      <Grid row>
        <Grid tablet={{ col: 3 }}>
          <span className="text-bold padding-right-2">{t("ebizPoc")}:</span>
          <span>
            {ebiz_poc_first_name} {ebiz_poc_last_name}
          </span>
        </Grid>
        <Grid tablet={{ col: 3 }}>
          <span className="text-bold padding-right-2">{t("contact")}:</span>
          <span>{ebiz_poc_email}</span>
        </Grid>
        <Grid tablet={{ col: 3 }}>
          <span className="text-bold padding-right-2">{t("uei")}:</span>
          <span>{uei}</span>
        </Grid>
        <Grid tablet={{ col: 3 }}>
          <span className="text-bold padding-right-2">{t("expiration")}:</span>
          <span>{expiration_date}</span>
        </Grid>
      </Grid>
      <div className="margin-top-2">
        {t.rich("visitSam", {
          link: (chunk) => (
            <a href="https://sam.gov" target="_blank">
              {chunk}
            </a>
          ),
        })}
      </div>
    </>
  );
};
