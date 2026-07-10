import { AwardRecommendationDetails } from "src/types/awardRecommendationTypes";

import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Button, Grid, GridContainer } from "@trussworks/react-uswds";

import Breadcrumbs from "src/components/core/Breadcrumbs";
import AwardRecommendationStatusTag from "./AwardRecommendationStatusTag";

// Action button - performs an action via form action (save, submit, etc.)
export type ActionButtonConfig = {
  type: "action";
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formAction: (formData: FormData) => Promise<any>;
  outline?: boolean;
  disabled?: boolean;
};

// Navigation button - redirects to another page (edit, preview)
export type NavigationButtonConfig = {
  type: "navigation";
  label: string;
  href: string;
  outline?: boolean;
};

export type HeroButtonConfig = ActionButtonConfig | NavigationButtonConfig;

interface AwardRecommendationHeroProps {
  awardRecommendationDetails?: AwardRecommendationDetails | null;
  buttons?: HeroButtonConfig[];
  heading?: string;
  showDateAndStatus?: boolean;
  additionalBreadcrumbs?: Array<{
    title: string;
    path: string;
  }>;
}

export default async function AwardRecommendationHero({
  awardRecommendationDetails,
  buttons,
  heading,
  showDateAndStatus = true,
  additionalBreadcrumbs,
}: AwardRecommendationHeroProps) {
  const t = await getTranslations("AwardRecommendation");

  const awardRecNum = awardRecommendationDetails?.award_recommendation_number;

  const preparedDate = awardRecommendationDetails?.created_at
    ? new Date(awardRecommendationDetails.created_at).toLocaleDateString()
    : new Date().toLocaleDateString();

  const statusValue = awardRecommendationDetails?.award_recommendation_status;

  const defaultHeading = awardRecNum ? `${t("heroTitle")}: ${awardRecNum}` : "";

  const breadcrumbList = [
    ...(awardRecommendationDetails
      ? [
          {
            title: t("awardRecs"),
            // TODO: add link to award recommendations page
            path: "/",
          },
          {
            title: `${t("heroTitle")}: ${awardRecNum}`,
            path: `/`,
          },
        ]
      : []),
    ...(additionalBreadcrumbs || []),
  ];

  return (
    <div
      data-testid="award-recommendation-hero"
      className="text-dark bg-base-lightest padding-bottom-4 mobile-lg:padding-y-4 tablet:padding-y-6"
    >
      <GridContainer>
        <Grid>
          {breadcrumbList.length > 0 && (
            <Breadcrumbs
              className="padding-y-0 bg-transparent"
              breadcrumbList={breadcrumbList}
            />
          )}
          {showDateAndStatus && awardRecommendationDetails ? (
            <>
              <Grid className="padding-bottom-4 mobile-lg:padding-y-4 tablet:padding-y-3">
                <h1 className="font-sans-xl tablet:font-sans-2xl">
                  {heading || defaultHeading}
                </h1>
              </Grid>
              <Grid row gap>
                <Grid tablet={{ col: "fill" }}>
                  <Grid>
                    <strong>{t("datePrepared")}: </strong>
                    <span className="margin-left-1 display-inline-flex flex-align-center">
                      {preparedDate}
                    </span>
                  </Grid>
                  <Grid className="padding-top-2 tablet:padding-top-2 display-flex flex-align-center">
                    <strong>{t("status")}:</strong>{" "}
                    <span className="margin-left-1 display-inline-flex flex-align-center">
                      {statusValue && (
                        <AwardRecommendationStatusTag status={statusValue} />
                      )}
                    </span>
                  </Grid>
                </Grid>
                {buttons && buttons.length > 0 && (
                  <Grid className="flex-align-self-end margin-top-4 tablet:margin-top-2 display-flex flex-justify-start gap-1">
                    {buttons.map((button, index) => {
                      if (button.type === "navigation") {
                        return (
                          <Link
                            key={index}
                            href={button.href}
                            className={`usa-button ${button.outline ? "usa-button--outline" : ""} width-auto`}
                            prefetch={false}
                          >
                            {button.label}
                          </Link>
                        );
                      } else {
                        return (
                          <Button
                            key={index}
                            type="submit"
                            formAction={button.formAction}
                            outline={button.outline}
                            disabled={button.disabled}
                            className="width-auto"
                          >
                            {button.label}
                          </Button>
                        );
                      }
                    })}
                  </Grid>
                )}
              </Grid>
            </>
          ) : (
            <Grid
              row
              gap
              className="padding-bottom-4 mobile-lg:padding-y-4 tablet:padding-y-3 flex-align-center"
            >
              <Grid tablet={{ col: "fill" }}>
                <h1 className="font-sans-xl tablet:font-sans-2xl margin-0">
                  {heading || defaultHeading}
                </h1>
              </Grid>
              {buttons && buttons.length > 0 && (
                <Grid className="display-flex flex-justify-start gap-1">
                  {buttons.map((button, index) => {
                    if (button.type === "navigation") {
                      return (
                        <Link
                          key={index}
                          href={button.href}
                          className={`usa-button ${button.outline ? "usa-button--outline" : ""} width-auto`}
                          prefetch={false}
                        >
                          {button.label}
                        </Link>
                      );
                    } else {
                      return (
                        <Button
                          key={index}
                          type="submit"
                          formAction={button.formAction}
                          outline={button.outline}
                          disabled={button.disabled}
                          className="width-auto"
                        >
                          {button.label}
                        </Button>
                      );
                    }
                  })}
                </Grid>
              )}
            </Grid>
          )}
        </Grid>
      </GridContainer>
    </div>
  );
}
