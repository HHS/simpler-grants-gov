"use client";

import Cookies from "js-cookie";
import { CLIENT_ENVIRONMENT_COOKIE_KEY } from "src/services/clientEnvironmentMiddleware";

import { useCallback, useEffect, useState } from "react";

/**
 * Allows all client components to access environment variables
 *
 * Note that this is necessary because
 */
export function useEnvironment(): {
  getEnvironmentVariable: (envVarName: string) => string;
} {
  const [clientEnvironment, setClientEnvironment] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    const envFromCookie = JSON.parse(
      Cookies.get(CLIENT_ENVIRONMENT_COOKIE_KEY) || "{}",
    );
    setClientEnvironment(envFromCookie);
  }, []);

  const getEnvironmentVariable = useCallback(
    (envVarName: string): string => {
      const value = clientEnvironment[envVarName];
      return value;
    },
    [clientEnvironment],
  );

  return {
    getEnvironmentVariable,
  };
}
