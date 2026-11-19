"use client";

import { LOGOUT_URL } from "src/constants/auth";
import { useUser } from "src/services/auth/useUser";
import { storeCurrentPage } from "src/utils/userUtils";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, ModalFooter, ModalRef } from "@trussworks/react-uswds";

import { SimplerModal } from "src/components/core/SimplerModal";

const MODAL_ID = "session-expiration-warning";
const DESCRIPTION_ID = `${MODAL_ID}-description`;
const MAX_WARNING_LEAD_MS = 2 * 60 * 1000;
const MAX_TIMEOUT_DELAY_MS = 2 ** 31 - 1;

export const getWarningDelayMs = (expiresAt: number, now: number) => {
  const remaining = expiresAt - now;
  return remaining - Math.min(MAX_WARNING_LEAD_MS, remaining / 2);
};

export const formatTimeRemaining = (ms: number) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export function SessionExpirationWarning() {
  const t = useTranslations("SessionExpirationWarning");
  const { user, featureFlags, refreshUser } = useUser();
  const modalRef = useRef<ModalRef | null>(null);
  const [warnedExpiresAt, setWarnedExpiresAt] = useState<number>();
  const [now, setNow] = useState(() => Date.now());

  const expiresAt =
    featureFlags.enableSessionExpirationAlerts && user?.isLoggedIn
      ? user.expiresAt
      : undefined;
  const isVisible = !!expiresAt && warnedExpiresAt === expiresAt;

  useEffect(() => {
    if (!expiresAt || expiresAt <= Date.now()) return;
    const delay = getWarningDelayMs(expiresAt, Date.now());
    if (delay > MAX_TIMEOUT_DELAY_MS) return;
    const timeout = setTimeout(() => {
      setNow(Date.now());
      setWarnedExpiresAt(expiresAt);
    }, delay);
    return () => clearTimeout(timeout);
  }, [expiresAt]);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isVisible]);

  useEffect(() => {
    modalRef.current?.toggleModal(undefined, isVisible);
  }, [isVisible]);

  const staySignedIn = useCallback(() => {
    setWarnedExpiresAt(undefined);
    refreshUser().catch(() => undefined);
  }, [refreshUser]);

  return (
    <SimplerModal
      modalId={MODAL_ID}
      modalRef={modalRef}
      titleText={t("title")}
      descriptionId={DESCRIPTION_ID}
      onClose={staySignedIn}
      className="text-wrap"
    >
      <p id={DESCRIPTION_ID}>{t("description")}</p>
      <p role="timer" className="text-bold">
        {t("countdown", {
          time: formatTimeRemaining((expiresAt ?? now) - now),
        })}
      </p>
      <ModalFooter>
        <Button type="button" onClick={staySignedIn}>
          {t("staySignedIn")}
        </Button>
        <form
          action={LOGOUT_URL}
          method="get"
          className="display-inline"
          onSubmit={() => storeCurrentPage(location.pathname, location.search)}
        >
          <Button type="submit" unstyled className="padding-105 text-center">
            {t("signOut")}
          </Button>
        </form>
      </ModalFooter>
    </SimplerModal>
  );
}
