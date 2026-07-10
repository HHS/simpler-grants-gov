import Link from "next/link";
import { Button, Grid, GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/core/Breadcrumbs";
import { USWDSIcon } from "src/components/core/USWDSIcon";

type AwardRecommendationSubmissionEditHeroProps = {
  awardRecommendationId: string;
  awardRecommendationBreadcrumbTitle: string;
  applicationSubmissionNumber: string;
  applicationId: string;
  awardRecsLabel: string;
  editTitle: string;
  viewOriginalApplicationLabel: string;
  cancelLabel: string;
  saveLabel: string;
};

export default function AwardRecommendationSubmissionEditHero({
  awardRecommendationId,
  awardRecommendationBreadcrumbTitle,
  applicationSubmissionNumber,
  applicationId,
  awardRecsLabel,
  editTitle,
  viewOriginalApplicationLabel,
  cancelLabel,
  saveLabel,
}: AwardRecommendationSubmissionEditHeroProps) {
  const editPageHref = `/award-recommendation/${awardRecommendationId}/edit`;

  return (
    <div
      data-testid="award-recommendation-submission-edit-hero"
      className="text-dark bg-base-lightest padding-bottom-4 mobile-lg:padding-y-4 tablet:padding-y-6"
    >
      <GridContainer>
        <Grid>
          <Breadcrumbs
            className="padding-y-0 bg-transparent"
            breadcrumbList={[
              {
                title: awardRecsLabel,
                path: "/",
              },
              {
                title: awardRecommendationBreadcrumbTitle,
                path: editPageHref,
              },
              {
                title: editTitle,
              },
            ]}
          />
          <Grid className="padding-bottom-4 mobile-lg:padding-y-4 tablet:padding-y-3">
            <h1 className="font-sans-xl tablet:font-sans-2xl">{editTitle}</h1>
          </Grid>
          <div className="display-flex flex-column tablet:flex-row tablet:flex-justify flex-align-end gap-2">
            <Link
              href={`/workspace/applications/${applicationId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="usa-link display-inline-flex flex-align-center flex-wrap"
            >
              {viewOriginalApplicationLabel} {applicationSubmissionNumber}
              <USWDSIcon
                name="launch"
                className="usa-icon--size-2 text-middle margin-left-05"
              />
            </Link>
            <div className="display-flex flex-justify-start gap-1 margin-top-4 tablet:margin-top-0 flex-shrink-0">
              <Link
                href={editPageHref}
                className="usa-button usa-button--outline width-auto"
                prefetch={false}
              >
                {cancelLabel}
              </Link>
              <Button type="submit" className="width-auto">
                {saveLabel}
              </Button>
            </div>
          </div>
        </Grid>
      </GridContainer>
    </div>
  );
}
