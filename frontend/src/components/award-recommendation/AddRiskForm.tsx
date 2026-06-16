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
} from "@trussworks/react-uswds";

import SimplerAlert from "src/components/core/SimplerAlert";
import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/core/TableWithResponsiveHeader";

const EMPTY_CELL = "—";

const tableCell = (
  cellData: TableCellData["cellData"],
  className?: string,
): TableCellData => ({
  cellData,
  className,
});

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

  const headers: TableCellData[] = [
    tableCell(t("columns.appNumber")),
    tableCell(t("columns.projectTitle")),
    tableCell(t("columns.orgName")),
    tableCell(t("columns.uei")),
    tableCell(t("columns.score")),
    tableCell(t("columns.recommendation")),
    tableCell(t("columns.requested"), "text-right"),
    tableCell(t("columns.recommended"), "text-right"),
  ];

  const rows: TableCellData[][] = selectedSubmissions.map((submission) => {
    const appSubmission = submission.application_submission;
    const detail = submission.submission_detail;
    const id = submission.award_recommendation_application_submission_id;

    return [
      tableCell(
        appSubmission.application_submission_number ? (
          <Link
            href={`/award-recommendation/${awardRecommendationId}/application-submissions/${id}/edit`}
          >
            {appSubmission.application_submission_number}
          </Link>
        ) : (
          EMPTY_CELL
        ),
      ),
      tableCell(appSubmission.project_title || EMPTY_CELL),
      tableCell(
        appSubmission.application?.organization?.organization_name ||
          EMPTY_CELL,
      ),
      tableCell(appSubmission.application?.organization?.uei || EMPTY_CELL),
      tableCell(EMPTY_CELL),
      tableCell(
        detail?.award_recommendation_type === "recommended_for_funding" ? (
          <span className="usa-tag font-sans-sm text-no-uppercase text-ink radius-2 bg-info-lighter">
            {t("recommendationType.recommended_for_funding")}
          </span>
        ) : (
          EMPTY_CELL
        ),
      ),
      tableCell(
        appSubmission.total_requested_amount
          ? `$${parseFloat(appSubmission.total_requested_amount).toLocaleString()}`
          : EMPTY_CELL,
        "text-right",
      ),
      tableCell(
        detail?.recommended_amount
          ? `$${parseFloat(detail.recommended_amount).toLocaleString()}`
          : EMPTY_CELL,
        "text-right",
      ),
    ];
  });

  return (
    <div>
      <h2 className="margin-top-0 margin-bottom-3">
        {t("selectedApplications")}
      </h2>

      <div className="width-full minw-0 overflow-auto">
        <TableWithResponsiveHeader
          headerContent={headers}
          tableRowData={rows}
        />
      </div>

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
            className="maxw-tablet-lg"
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
            className="maxw-tablet-lg"
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
