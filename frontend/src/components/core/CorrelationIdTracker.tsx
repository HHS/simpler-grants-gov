"use client";

import noop from "lodash/noop";
import {
  setNewRelicCorrelationIdAttribute,
  waitForNewRelic,
} from "src/utils/analyticsUtil";

import { useEffect } from "react";

export const CorrelationIdTracker = ({
  correlationId,
}: {
  correlationId?: string;
}) => {
  useEffect(() => {
    if (!correlationId) {
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
  }, [correlationId]);

  return null;
};
