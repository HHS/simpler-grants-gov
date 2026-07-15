"use client";

import { RecommendationDetailForm } from "src/app/[locale]/(base)/award-recommendation/[id]/application-submissions/[applicationSubmissionId]/edit/_components/RecommendationDetailsSection";
import { useSelectedSubmissions } from "src/hooks/useSelectedSubmissions";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ButtonGroup } from "@trussworks/react-uswds";

import SelectedApplicationsTable from "src/components/award-recommendation/SelectedApplicationsTable";
import SimplerAlert from "src/components/core/SimplerAlert";

interface EditRecommendationsFormProps {
  awardRecommendationId: string;
}

export default function EditRecommendationsForm({
  awardRecommendationId,
}: EditRecommendationsFormProps) {
  const t = useTranslations("AwardRecommendation.editRecommendations");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { selectedSubmissions, hasSelections } = useSelectedSubmissions(
    awardRecommendationId,
  );

  const isSingleSubmission = selectedSubmissions.length === 1;
  const isMultipleSubmissions = selectedSubmissions.length > 1;

  const handleCancel = () => {
    router.push(
      `/award-recommendation/${awardRecommendationId}/application-submissions/edit`,
    );
  };

  const handleSave = () => {
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

      {isMultipleSubmissions && (
        <p className="margin-top-0 margin-bottom-2 text-base">
          {selectedSubmissions.length} {t("submissionsSelected")}
        </p>
      )}

      <SelectedApplicationsTable
        awardRecommendationId={awardRecommendationId}
        submissions={selectedSubmissions}
      />

      <div className="margin-top-4">
        <RecommendationDetailForm
          submission={isSingleSubmission ? selectedSubmissions[0] : undefined}
          submissions={isMultipleSubmissions ? selectedSubmissions : undefined}
        />

        <ButtonGroup className="margin-top-4">
          <Button type="button" onClick={handleSave} disabled={isSubmitting}>
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
