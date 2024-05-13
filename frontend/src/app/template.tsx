"use client";

import { useEffect } from "react";
import { sendGAEvent } from "@next/third-parties/google";
import { PUBLIC_ENV } from "../constants/environments";

export default function Template({ children }: { children: React.ReactNode }) {
  const isProd = process.env.NODE_ENV === "development";

  useEffect(() => {
    isProd &&
      PUBLIC_ENV.GOOGLE_ANALYTICS_ID &&
      sendGAEvent({ event: "page_view" });
  }, [isProd]);

  return <div>{children}</div>;
}
