"use client";

import noop from "lodash/noop";
import {
  setNewRelicCorrelationIdAttribute,
  waitForNewRelic,
} from "src/utils/analyticsUtil";

import { useEffect } from "react";

export const CorrelationIdTracker = ({
  correlationId,
  newRelicEnabled,
}: {
  correlationId?: string;
  newRelicEnabled: boolean;
}) => {
  useEffect(() => {
    if (!correlationId || !newRelicEnabled) {
      return;
    }

    let isCancelled = false;

    const attachCorrelationId = async () => {
      const ready = await waitForNewRelic();
      if (!ready || isCancelled) {
        return;
      }

      setNewRelicCorrelationIdAttribute(correlationId);
    };

    attachCorrelationId().catch(noop);

    return () => {
      isCancelled = true;
    };
  }, [correlationId, newRelicEnabled]);

  return null;
};
