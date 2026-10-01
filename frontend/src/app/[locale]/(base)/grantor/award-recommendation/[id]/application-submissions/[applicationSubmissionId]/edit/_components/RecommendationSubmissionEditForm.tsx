"use client";

import {
  RecommendationDetailsSection,
  type RecommendationDetailFormHandle,
} from "src/app/[locale]/(base)/grantor/award-recommendation/[id]/application-submissions/[applicationSubmissionId]/edit/_components/RecommendationDetailsSection";
import { AwardRecommendationSubmission } from "src/types/awardRecommendationTypes";

import { FormEvent, ReactNode, useRef } from "react";
import { GridContainer } from "@trussworks/react-uswds";

type RecommendationSubmissionEditFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  awardRecommendationId: string;
  applicationSubmissionId: string;
  submission: AwardRecommendationSubmission;
  hero: ReactNode;
};

export default function RecommendationSubmissionEditForm({
  action,
  awardRecommendationId,
  applicationSubmissionId,
  submission,
  hero,
}: RecommendationSubmissionEditFormProps) {
  const formRef = useRef<RecommendationDetailFormHandle>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!formRef.current?.validate()) {
      event.preventDefault();
    }
  };

  return (
    <form action={action} onSubmit={handleSubmit}>
      {hero}
      <GridContainer>
        <input
          type="hidden"
          name="award_recommendation_id"
          value={awardRecommendationId}
        />
        <input
          type="hidden"
          name="award_recommendation_application_submission_id"
          value={applicationSubmissionId}
        />
        <RecommendationDetailsSection submission={submission} ref={formRef} />
      </GridContainer>
    </form>
  );
}
