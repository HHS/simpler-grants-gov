"use client";

import { useSelectedSubmissions } from "src/hooks/useSelectedSubmissions";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Button,
  ButtonGroup,
  CharacterCount,
  Select,
  Table,
} from "@trussworks/react-uswds";

import SimplerAlert from "src/components/core/SimplerAlert";

interface AddRiskFormProps {
  awardRecommendationId: string;
}

export default function AddRiskForm({
  awardRecommendationId,
}: AddRiskFormProps) {
  const t = useTranslations("AwardRecommendation.risks");
  const router = useRouter();
  const [riskSummary, setRiskSummary] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");

  const { selectedSubmissions, hasSelections } = useSelectedSubmissions(
    awardRecommendationId,
  );

  const handleCancel = () => {
    router.push(`/award-recommendation/${awardRecommendationId}/edit`);
  };

  const handleSave = async () => {
    // TODO: Implement save functionality
    console.log("Saving risk:", {
      riskSummary,
      selectedCondition,
      submissions: selectedSubmissions.map(
        (s) => s.award_recommendation_application_submission_id,
      ),
    });
  };

  if (!hasSelections) {
    return (
      <SimplerAlert
        alertClick={() =>
          router.push(`/award-recommendation/${awardRecommendationId}/risks`)
        }
        buttonId="no-selections-alert"
        messageText={t("noSelectionsMessage")}
        type="error"
      />
    );
  }

  return (
    <div>
      <h2 className="margin-top-0 margin-bottom-3">
        {t("selectedApplications")}
      </h2>

      <Table fullWidth>
        <thead>
          <tr>
            <th scope="col">{t("columns.appNumber")}</th>
            <th scope="col">{t("columns.projectTitle")}</th>
            <th scope="col">{t("columns.orgName")}</th>
            <th scope="col">{t("columns.uei")}</th>
            <th scope="col">{t("columns.score")}</th>
            <th scope="col">{t("columns.recommendation")}</th>
            <th scope="col">{t("columns.requested")}</th>
            <th scope="col">{t("columns.recommended")}</th>
          </tr>
        </thead>
        <tbody>
          {selectedSubmissions.map((submission) => {
            const appSubmission = submission.application_submission;
            const detail = submission.submission_detail;
            const id =
              submission.award_recommendation_application_submission_id;

            return (
              <tr key={id}>
                <td>
                  {appSubmission.application_submission_number ? (
                    <Link
                      href={`/award-recommendation/${awardRecommendationId}/application-submissions/${id}/edit`}
                      className="usa-link"
                    >
                      {appSubmission.application_submission_number}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{appSubmission.project_title || "—"}</td>
                <td>
                  {appSubmission.application?.organization?.organization_name ||
                    "—"}
                </td>
                <td>{appSubmission.application?.organization?.uei || "—"}</td>
                <td>—</td>
                <td>
                  {detail?.award_recommendation_type ===
                  "recommended_for_funding" ? (
                    <span className="usa-tag font-sans-sm text-no-uppercase text-ink radius-2 bg-info-lighter">
                      {t("recommendationType.recommended_for_funding")}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  {appSubmission.total_requested_amount
                    ? `$${parseFloat(appSubmission.total_requested_amount).toLocaleString()}`
                    : "—"}
                </td>
                <td>
                  {detail?.recommended_amount
                    ? `$${parseFloat(detail.recommended_amount).toLocaleString()}`
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <div className="margin-top-6">
        <h2 className="margin-top-0 margin-bottom-3">
          {t("riskDetailsHeading")}
        </h2>

        <div>
          <label className="usa-label text-bold" htmlFor="risk-summary">
            {t("riskSummaryLabel")}
            <abbr title="required" className="usa-hint usa-hint--required">
              *
            </abbr>
          </label>
          <span className="usa-hint">{t("riskSummaryHint")}</span>
          <CharacterCount
            id="risk-summary"
            name="risk-summary"
            maxLength={1000}
            isTextArea
            rows={6}
            value={riskSummary}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setRiskSummary(e.target.value)
            }
            className="width-full"
          />
        </div>

        <div className="margin-top-3">
          <label
            className="usa-label text-bold"
            htmlFor="recommended-condition"
          >
            {t("recommendedConditionLabel")}
          </label>
          <span className="usa-hint">{t("recommendedConditionHint")}</span>
          <Select
            id="recommended-condition"
            name="recommended-condition"
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="width-full"
          >
            <option value="">{t("selectConditionPlaceholder")}</option>
            <option value="condition1">{t("condition1")}</option>
            <option value="condition2">{t("condition2")}</option>
            <option value="condition3">{t("condition3")}</option>
          </Select>
        </div>

        <ButtonGroup className="margin-top-4">
          <Button type="button" onClick={handleCancel} outline>
            {t("cancelButton")}
          </Button>
          <Button type="button" onClick={handleSave}>
            {t("saveButton")}
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
