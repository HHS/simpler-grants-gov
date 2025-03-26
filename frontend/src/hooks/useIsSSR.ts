import { useEffect, useState } from "react";

export const useIsSSR = () => {
  const [isSSR, setIsSSR] = useState(true);
  useEffect(() => {
    setIsSSR(false);
  }, []);
  return isSSR;
};
