"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button, Grid } from "@trussworks/react-uswds";

const BeforeYouGetStartedStep = () => {
  const t = useTranslations("CreateAwardRecommendation");
  return (
    <div className="display-flex gap-3 margin-bottom-4 position-relative">
      <div className="flex-0 position-relative margin-right-3">
        <div className="width-4 height-4 radius-pill border-2px border-ink bg-white text-ink display-flex flex-align-center flex-justify-center text-bold font-sans-xs">
          1
        </div>
        <div className="position-absolute left-2 top-4 width-05 award-recommendation-step-connector" />
      </div>
      <div className="flex-1">
        <p className="margin-top-0 margin-bottom-1 font-sans-lg font-weight-normal">
          {t("steps.identifyOpportunity.title")}
        </p>
        <p className="margin-top-0 margin-bottom-0 text-ink font-sans-sm line-height-sans-4">
          {t("steps.identifyOpportunity.description")}
        </p>
      </div>
    </div>
  );
};

const ApplyRecommendationsStep = () => {
  const t = useTranslations("CreateAwardRecommendation");
  return (
    <div className="display-flex gap-3 margin-bottom-4 position-relative">
      <div className="flex-0 position-relative margin-right-3">
        <div className="width-4 height-4 radius-pill border-2px border-ink bg-white text-ink display-flex flex-align-center flex-justify-center text-bold font-sans-xs">
          2
        </div>
        <div className="position-absolute left-2 top-4 width-05 award-recommendation-step-connector" />
      </div>
      <div className="flex-1">
        <p className="margin-top-0 margin-bottom-1 font-sans-lg font-weight-normal">
          {t("steps.applyRecommendations.title")}
        </p>
        <p className="margin-top-0 margin-bottom-2 text-ink font-sans-sm line-height-sans-4">
          {t("steps.applyRecommendations.description")}
        </p>
        <ul className="usa-list margin-top-0 margin-bottom-0 font-sans-sm text-ink">
          <li>{t("steps.applyRecommendations.bullet1")}</li>
          <li>{t("steps.applyRecommendations.bullet2")}</li>
          <li>{t("steps.applyRecommendations.bullet3")}</li>
        </ul>
      </div>
    </div>
  );
};

const ProvideAttachmentsStep = () => {
  const t = useTranslations("CreateAwardRecommendation");
  return (
    <div className="display-flex gap-3 margin-bottom-4 position-relative">
      <div className="flex-0 position-relative margin-right-3">
        <div className="width-4 height-4 radius-pill border-2px border-ink bg-white text-ink display-flex flex-align-center flex-justify-center text-bold font-sans-xs">
          3
        </div>
      </div>
      <div className="flex-1">
        <p className="margin-top-0 margin-bottom-1 font-sans-lg font-weight-normal">
          {t("steps.provideAttachments.title")}
        </p>
        <p className="margin-top-0 margin-bottom-2 text-ink font-sans-sm line-height-sans-4">
          {t("steps.provideAttachments.description")}
        </p>
        <ul className="usa-list margin-top-0 margin-bottom-0 font-sans-sm text-ink">
          <li>{t("steps.provideAttachments.bullet1")}</li>
          <li>{t("steps.provideAttachments.bullet2")}</li>
          <li>{t("steps.provideAttachments.bullet3")}</li>
        </ul>
      </div>
    </div>
  );
};

export const CreateRecommendationContent = () => {
  const t = useTranslations("CreateAwardRecommendation");
  const router = useRouter();

  const handleCancel = () => {
    router.back();
  };

  const handleNext = () => {
    router.push("/award-recommendation/select-opportunity");
  };

  return (
    <Grid row className="grid-gap">
      <Grid col={9} tablet={{ col: 9 }}>
        <div className="margin-top-5 margin-bottom-5">
          <h2 className="margin-top-0 margin-bottom-2 font-sans-xl text-bold">
            {t("beforeYouGetStarted")}
          </h2>
          <p className="text-base margin-bottom-5 font-sans-sm line-height-sans-4">
            {t("introDescription")}
          </p>

          <BeforeYouGetStartedStep />
          <ApplyRecommendationsStep />
          <ProvideAttachmentsStep />

          <div className="display-flex gap-2 margin-top-5">
            <Button
              type="button"
              className="usa-button--outline"
              onClick={handleCancel}
            >
              {t("buttons.cancel")}
            </Button>
            <Button type="button" onClick={handleNext}>
              {t("buttons.next")}
            </Button>
          </div>
        </div>
      </Grid>
    </Grid>
  );
};
