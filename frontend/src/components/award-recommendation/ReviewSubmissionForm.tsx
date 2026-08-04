"use client";

import { UploadFileMetadata } from "src/types/fileUploadTypes";

import { useTranslations } from "next-intl";
import React, { useState } from "react";
import {
  Button,
  ButtonGroup,
  CharacterCount,
  Checkbox,
  FormGroup,
  Radio,
} from "@trussworks/react-uswds";

import { SimplerFileInput } from "src/components/core/fileInput/SimplerFileInput";

export type ReviewFormType = "content_creator" | "reviewer" | "fmo_reviewer";

export interface ReviewFormData {
  review_comment: string;
  internal_comment?: string;
  has_internal_comment: boolean;
  decision?: string;
  contingent_date?: string;
  supplemental_documents?: UploadFileMetadata[];
}

interface ReviewSubmissionFormProps {
  formType: ReviewFormType;
  awardRecommendationId: string;
  onSubmit: (formData: ReviewFormData) => Promise<void>;
  onCancel: () => void;
}

export const ReviewSubmissionForm: React.FC<ReviewSubmissionFormProps> = ({
  formType,
  awardRecommendationId: _awardRecommendationId,
  onSubmit,
  onCancel,
}) => {
  const t = useTranslations("AwardRecommendation.reviewForm");

  const [reviewComment, setReviewComment] = useState("");
  const [internalComment, setInternalComment] = useState("");
  const [hasInternalComment, setHasInternalComment] = useState(false);
  const [decision, setDecision] = useState("");
  const [contingentDate, setContingentDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFileMetadata[]>([]);

  // TODO: Form submission collects data but backend integration is incomplete
  // Review workflow state transitions and file associations need full implementation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        review_comment: reviewComment,
        internal_comment: hasInternalComment ? internalComment : undefined,
        has_internal_comment: hasInternalComment,
        decision: decision || undefined,
        contingent_date: contingentDate || undefined,
        supplemental_documents:
          uploadedFiles.length > 0 ? uploadedFiles : undefined,
      });
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // TODO: Decision values need final approval before backend integration
  // Current decision values (funds_available, funds_contingent, no_certification, etc.) 
  // were implemented but may require modification based on final business requirements
  // Verify these align with backend workflow state transitions before completing API integration
  const renderDecisionSection = () => {
    if (formType === "content_creator") {
      return null;
    }

    if (formType === "fmo_reviewer") {
      return (
        <FormGroup>
          <legend className="usa-legend text-bold measure-none">
            {t("fmo.question")}
            <span className="usa-hint usa-hint--required text-no-underline">
              {" "}
              *
            </span>
          </legend>
          <Radio
            id="funds_available"
            className="margin-top-2"
            name="fmo_decision"
            label={t("fmo.fundsAvailable")}
            value="funds_available"
            checked={decision === "funds_available"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDecision(e.target.value)
            }
          />
          <Radio
            id="funds_contingent"
            name="fmo_decision"
            label={t("fmo.fundsContingent")}
            value="funds_contingent"
            checked={decision === "funds_contingent"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDecision(e.target.value)
            }
          />
          {decision === "funds_contingent" && (
            <div className="margin-left-4 margin-top-2 margin-bottom-2">
              <FormGroup>
                <label htmlFor="contingent_date" className="usa-label">
                  {t("fmo.dateLabel")}
                  <span className="usa-hint usa-hint--required text-no-underline">
                    {" "}
                    *
                  </span>
                </label>
                <input
                  type="date"
                  id="contingent_date"
                  name="contingent_date"
                  className="usa-input"
                  value={contingentDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setContingentDate(e.target.value)
                  }
                  required={decision === "funds_contingent"}
                />
              </FormGroup>
            </div>
          )}
          <Radio
            id="no_certification"
            name="fmo_decision"
            label={t("fmo.noCertification")}
            value="no_certification"
            checked={decision === "no_certification"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDecision(e.target.value)
            }
          />
          <Radio
            id="hold_review"
            name="fmo_decision"
            label={t("fmo.hold")}
            value="hold_review"
            checked={decision === "hold_review"}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDecision(e.target.value)
            }
          />
        </FormGroup>
      );
    }

    return (
      <FormGroup>
        <legend className="usa-legend text-bold measure-none">
          {t("reviewer.question")}
          <span className="usa-hint usa-hint--required text-no-underline">
            {" "}
            *
          </span>
        </legend>
        <Radio
          id="yes_concur"
          className="margin-top-2"
          name="reviewer_decision"
          label={t("reviewer.yesConcur")}
          value="yes_concur"
          checked={decision === "yes_concur"}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDecision(e.target.value)
          }
        />
        <Radio
          id="no_issues"
          name="reviewer_decision"
          label={t("reviewer.noIssues")}
          value="no_issues"
          checked={decision === "no_issues"}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDecision(e.target.value)
          }
        />
        <Radio
          id="hold_review"
          name="reviewer_decision"
          label={t("reviewer.hold")}
          value="hold_review"
          checked={decision === "hold_review"}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDecision(e.target.value)
          }
        />
      </FormGroup>
    );
  };

  // TODO: File upload handler is stubbed - needs to be connected to actual file upload API
  // Currently returns mock data and does not persist files to backend
  const postUploadAction = (fileId: string, _signal: AbortSignal) => {
    return Promise.resolve({
      id: fileId,
      fileName: fileId,
      updatedAt: new Date().toISOString(),
    });
  };

  // TODO: File delete handler only removes from local state - does not delete from backend
  // Needs to call API endpoint to delete file from storage when backend is ready
  const handleDelete = (fileId: string) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.id !== fileId));
    return Promise.resolve();
  };

  const handleUploadSuccess = (result: unknown) => {
    const uploadResult = result as UploadFileMetadata;
    setUploadedFiles([...uploadedFiles, uploadResult]);
  };

  const attestationText =
    formType === "content_creator"
      ? t("attestation.contentCreator")
      : t("attestation.reviewer");

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="usa-form maxw-full">
      {renderDecisionSection()}

      <FormGroup>
        <label htmlFor="review_comment" className="usa-label text-bold">
          {t("reviewComment.label")}
          <span className="usa-hint usa-hint--required text-no-underline">
            {" "}
            *
          </span>
        </label>
        <p className="text-base-dark margin-top-1 margin-bottom-2">
          {t("reviewComment.description")}
        </p>
        <CharacterCount
          id="review_comment"
          name="review_comment"
          maxLength={2000}
          isTextArea
          value={reviewComment}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setReviewComment(e.target.value)
          }
          rows={6}
          className="maxw-full"
          required
        />
      </FormGroup>

      <FormGroup>
        <Checkbox
          id="has_internal_comment"
          name="has_internal_comment"
          label={t("internalComment.checkboxLabel")}
          checked={hasInternalComment}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setHasInternalComment(e.target.checked)
          }
        />
      </FormGroup>

      {hasInternalComment && (
        <FormGroup>
          <label htmlFor="internal_comment" className="usa-label text-bold">
            {t("internalComment.label")}
            <span className="usa-hint usa-hint--required text-no-underline">
              {" "}
              *
            </span>
          </label>
          <p className="text-base-dark margin-top-1 margin-bottom-2">
            {t("internalComment.description")}
          </p>
          <CharacterCount
            id="internal_comment"
            name="internal_comment"
            maxLength={2000}
            isTextArea
            value={internalComment}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInternalComment(e.target.value)
            }
            rows={6}
            className="maxw-full"
            required={hasInternalComment}
          />
        </FormGroup>
      )}

      <FormGroup>
        <label htmlFor="supplemental_documents" className="usa-label text-bold">
          {t("supplementalDocuments.label")}
        </label>
        <p className="text-base-dark margin-top-1 margin-bottom-2">
          {t("supplementalDocuments.description")}
        </p>
        <SimplerFileInput
          id="supplemental_documents"
          labelId="supplemental_documents"
          postUploadAction={postUploadAction}
          postUploadActionProgressMessage={t("supplementalDocuments.uploading")}
          postUploadActionSuccessMessage={t(
            "supplementalDocuments.uploadSuccess",
          )}
          postUploadActionErrorMessage={t("supplementalDocuments.uploadError")}
          onDelete={handleDelete}
          onSuccess={handleUploadSuccess}
          existingFiles={uploadedFiles}
          multiFile={true}
        />
      </FormGroup>

      <div className="bg-base-lightest padding-2 padding-bottom-3 margin-top-3 margin-bottom-3 review-attestation-box">
        <p className="text-base margin-top-0 margin-bottom-0">
          {attestationText}
        </p>
        <ButtonGroup className="margin-top-3">
          <Button
            type="submit"
            disabled={isSubmitting || !reviewComment.trim()}
            className="usa-button--compact"
          >
            {isSubmitting ? t("buttons.submitting") : t("buttons.submit")}
          </Button>
          <Button
            type="button"
            outline
            onClick={onCancel}
            disabled={isSubmitting}
            className="usa-button--compact"
          >
            {t("buttons.cancel")}
          </Button>
        </ButtonGroup>
      </div>
    </form>
  );
};
