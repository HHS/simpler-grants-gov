"use client";

import { saveAwardRecommendation } from "src/app/[locale]/(base)/award-recommendation/[id]/actions";
import { useSnackbar } from "src/hooks/useSnackbar";

import { useTranslations } from "next-intl";
import {
  MouseEvent,
  startTransition,
  useActionState,
  useEffect,
  useState,
} from "react";
import { Button } from "@trussworks/react-uswds";

interface AwardRecommendationSaveButtonProps {
  label: string;
}

export default function AwardRecommendationSaveButton({
  label,
}: AwardRecommendationSaveButtonProps) {
  const t = useTranslations("AwardRecommendation");
  const [state, formAction, isPending] = useActionState(
    saveAwardRecommendation,
    {},
  );
  const { hideSnackbar, snackbarIsVisible, showSnackbar, Snackbar } =
    useSnackbar();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (state.success) {
      setMessage(t("save.success"));
      showSnackbar();
    } else if (state.errorMessage) {
      setMessage(t("save.error"));
      showSnackbar();
    }
  }, [state, showSnackbar, t]);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const form = event.currentTarget.closest("form");
    if (!form) {
      return;
    }
    const formData = new FormData(form);
    startTransition(() => formAction(formData));
  };

  return (
    <>
      <Button
        type="button"
        onClick={handleClick}
        outline
        disabled={isPending}
        className="width-auto"
      >
        {label}
      </Button>
      <Snackbar isVisible={snackbarIsVisible} close={hideSnackbar}>
        {message}
      </Snackbar>
    </>
  );
}
