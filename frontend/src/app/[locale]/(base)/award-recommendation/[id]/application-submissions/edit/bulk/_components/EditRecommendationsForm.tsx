"use client";

import { useSelectedSubmissions } from "src/hooks/useSelectedSubmissions";
import { AwardRecommendationType } from "src/types/awardRecommendationTypes";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ButtonGroup, Label, Select } from "@trussworks/react-uswds";

import SelectedApplicationsTable from "src/components/award-recommendation/SelectedApplicationsTable";
import SimplerAlert from "src/components/core/SimplerAlert";

interface EditRecommendationsFormProps {
  awardRecommendationId: string;
}

export default function EditRecommendationsForm({
  awardRecommendationId,
}: EditRecommendationsFormProps) {
  const t = useTranslations("AwardRecommendation.editRecommendations");
  const tOptions = useTranslations(
    "AwardRecommendation.recommendations.submissions.recommendationOptions",
  );
  const router = useRouter();
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<AwardRecommendationType>("recommended_for_funding");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { selectedSubmissions, hasSelections } = useSelectedSubmissions(
    awardRecommendationId,
  );

  const handleCancel = () => {
    router.push(
      `/award-recommendation/${awardRecommendationId}/application-submissions/edit`,
    );
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);

    // TODO: Implement bulk update API call
    // For now, just navigate back
    setTimeout(() => {
      router.push(
        `/award-recommendation/${awardRecommendationId}/application-submissions/edit`,
      );
    }, 500);
  };

  if (!hasSelections) {
    return (
      <SimplerAlert
        alertClick={() =>
          router.push(
            `/award-recommendation/${awardRecommendationId}/application-submissions/edit`,
          )
        }
        buttonId="no-selections-alert"
        messageText={t("noSelectionsMessage")}
        type="error"
      />
    );
  }

  return (
    <div>
      {error && (
        <div className="margin-bottom-4">
          <SimplerAlert
            alertClick={() => setError(null)}
            buttonId="error-alert"
            messageText={error}
            type="error"
          />
        </div>
      )}

      <h2 className="margin-top-0 margin-bottom-3">
        {t("selectedApplications")}
      </h2>

      <SelectedApplicationsTable
        awardRecommendationId={awardRecommendationId}
        submissions={selectedSubmissions}
      />

      <div className="margin-top-4">
        <h3 className="margin-top-0 margin-bottom-2">
          {t("bulkEditHeading")}
        </h3>
        <p className="text-base-dark margin-top-0 margin-bottom-3">
          {t("bulkEditDescription")}
        </p>

        <div className="maxw-tablet">
          <Label htmlFor="recommendation-type">{t("recommendationType")}</Label>
          <Select
            id="recommendation-type"
            name="recommendation-type"
            value={selectedRecommendation}
            onChange={(e) =>
              setSelectedRecommendation(e.target.value as AwardRecommendationType)
            }
            disabled={isSubmitting}
          >
            <option value="recommended_for_funding">
              {tOptions("recommended")}
            </option>
            <option value="recommended_without_funding">
              {tOptions("recommendedWithoutFunding")}
            </option>
            <option value="not_recommended">
              {tOptions("notRecommended")}
            </option>
          </Select>
        </div>

        <ButtonGroup className="margin-top-4">
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSubmitting}
          >
            {isSubmitting ? t("saving") : t("saveButton")}
          </Button>
          <Button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            unstyled
            className="padding-105 text-center"
          >
            {t("cancelButton")}
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
