"use client";

import { updateRiskAction } from "src/app/[locale]/(base)/award-recommendation/[id]/risks/actions";
import {
  AwardRecommendationRisk,
  AwardRecommendationSubmission,
} from "src/types/awardRecommendationTypes";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import RiskDetailsFields from "src/components/award-recommendation/RiskDetailsFields";
import SelectedApplicationsTable from "src/components/award-recommendation/SelectedApplicationsTable";
import SimplerAlert from "src/components/core/SimplerAlert";

interface EditRiskFormProps {
  awardRecommendationId: string;
  risk: AwardRecommendationRisk;
  submissions: AwardRecommendationSubmission[];
}

export default function EditRiskForm({
  awardRecommendationId,
  risk,
  submissions,
}: EditRiskFormProps) {
  const t = useTranslations("AwardRecommendation.risks");
  const router = useRouter();
  const [riskSummary, setRiskSummary] = useState(risk.comment || "");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [riskSummaryError, setRiskSummaryError] = useState<string | null>(null);

  const handleCancel = () => {
    router.push(`/award-recommendation/${awardRecommendationId}/edit`);
  };

  const handleRiskSummaryBlur = () => {
    if (!riskSummary.trim()) {
      setRiskSummaryError(t("riskSummaryRequired"));
    } else {
      setRiskSummaryError(null);
    }
  };

  const handleSave = async () => {
    if (!riskSummary.trim()) {
      setRiskSummaryError(t("riskSummaryRequired"));
      setError(t("validationError"));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setRiskSummaryError(null);

    const submissionIds = submissions.map(
      (submission) => submission.award_recommendation_application_submission_id,
    );

    const result = await updateRiskAction(
      awardRecommendationId,
      risk.award_recommendation_risk_id,
      {
        comment: riskSummary,
        award_recommendation_risk_type:
          risk.award_recommendation_risk_type || "additional_monitoring",
        award_recommendation_application_submission_ids: submissionIds,
      },
    );

    if (result.success) {
      router.push(`/award-recommendation/${awardRecommendationId}/edit`);
    } else {
      setError(result.errorMessage || t("saveError"));
      setIsSubmitting(false);
    }
  };

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
        submissions={submissions}
      />

      <RiskDetailsFields
        riskSummary={riskSummary}
        onRiskSummaryChange={setRiskSummary}
        onRiskSummaryBlur={handleRiskSummaryBlur}
        riskSummaryError={riskSummaryError}
        selectedCondition={selectedCondition}
        onSelectedConditionChange={setSelectedCondition}
        isSubmitting={isSubmitting}
        onCancel={handleCancel}
        onSave={() => void handleSave()}
      />
    </div>
  );
}
