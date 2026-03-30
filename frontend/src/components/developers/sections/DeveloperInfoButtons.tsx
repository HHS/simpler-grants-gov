"use client";

import { useUser } from "src/services/auth/useUser";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRef } from "react";
import { Button, ModalRef, ModalToggleButton } from "@trussworks/react-uswds";

import { LoginModal } from "src/components/LoginModal";

export default function DeveloperInfoButtons() {
  const t = useTranslations("Developer");
  const headerTranslations = useTranslations("HeaderLoginModal");
  const { user } = useUser();
  const modalRef = useRef<ModalRef>(null);

  return (
    <>
      {user?.token ? (
        <Link href="/api-dashboard">
          <Button
            className="margin-y-2 usa-button--secondary"
            type="button"
            size="big"
          >
            {t("apiDashboardLink")}
          </Button>
        </Link>
      ) : (
        <>
          <ModalToggleButton
            modalRef={modalRef}
            opener
            className="margin-y-2 usa-button usa-button--secondary usa-button--big"
            type="button"
          >
            {t("apiDashboardLink")}
          </ModalToggleButton>
          <LoginModal
            modalRef={modalRef as React.RefObject<ModalRef>}
            helpText={headerTranslations("help")}
            buttonText={headerTranslations("button")}
            closeText={headerTranslations("close")}
            descriptionText={headerTranslations("description")}
            titleText={headerTranslations("title")}
            modalId="developer-api-keys-login-modal"
          />
        </>
      )}
    </>
  );
}
