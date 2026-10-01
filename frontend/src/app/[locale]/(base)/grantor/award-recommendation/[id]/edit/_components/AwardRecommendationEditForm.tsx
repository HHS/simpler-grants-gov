"use client";

import { saveAwardRecommendation } from "src/app/[locale]/(base)/grantor/award-recommendation/[id]/actions";

import { useTranslations } from "next-intl";
import { createContext, ReactNode, useActionState, useContext } from "react";
import { Alert, GridContainer } from "@trussworks/react-uswds";

type AwardRecommendationEditFormContextValue = {
  formAction: (formData: FormData) => void;
  isPending: boolean;
};

const AwardRecommendationEditFormContext =
  createContext<AwardRecommendationEditFormContextValue | null>(null);

export function useAwardRecommendationEditForm() {
  const context = useContext(AwardRecommendationEditFormContext);
  if (!context) {
    throw new Error(
      "useAwardRecommendationEditForm must be used within AwardRecommendationEditForm",
    );
  }
  return context;
}

interface AwardRecommendationEditFormProps {
  awardRecommendationId: string;
  hero: ReactNode;
  children: ReactNode;
}

export default function AwardRecommendationEditForm({
  awardRecommendationId,
  hero,
  children,
}: AwardRecommendationEditFormProps) {
  const t = useTranslations("AwardRecommendation");
  const [state, formAction, isPending] = useActionState(
    saveAwardRecommendation,
    {},
  );

  return (
    <AwardRecommendationEditFormContext.Provider
      value={{ formAction, isPending }}
    >
      <form>
        <input
          type="hidden"
          name="award_recommendation_id"
          value={awardRecommendationId}
        />
        {hero}
        <GridContainer>
          {state.errorMessage ? (
            <div className="margin-top-2">
              <Alert
                type="warning"
                heading={state.errorMessage}
                headingLevel="h3"
                validation
              />
            </div>
          ) : null}
          {state.success ? (
            <div className="margin-top-2">
              <Alert
                type="success"
                heading={t("save.success")}
                headingLevel="h3"
                noIcon
              />
            </div>
          ) : null}
          {children}
        </GridContainer>
      </form>
    </AwardRecommendationEditFormContext.Provider>
  );
}
