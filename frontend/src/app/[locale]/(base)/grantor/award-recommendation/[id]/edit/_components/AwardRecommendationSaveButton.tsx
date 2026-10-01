"use client";

import { MouseEvent, startTransition } from "react";
import { Button } from "@trussworks/react-uswds";

import { useAwardRecommendationEditForm } from "./AwardRecommendationEditForm";

interface AwardRecommendationSaveButtonProps {
  label: string;
}

export default function AwardRecommendationSaveButton({
  label,
}: AwardRecommendationSaveButtonProps) {
  const { formAction, isPending } = useAwardRecommendationEditForm();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const form = event.currentTarget.closest("form");
    if (!form) {
      return;
    }
    const formData = new FormData(form);
    startTransition(() => formAction(formData));
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      outline
      disabled={isPending}
      className="width-auto"
    >
      {label}
    </Button>
  );
}
