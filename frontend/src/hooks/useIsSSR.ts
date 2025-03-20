import { useEffect, useState } from "react";

export const useIsSSR = () => {
  const [isSSR, setIsSSR] = useState(true);
  console.log("!!! render");
  useEffect(() => {
    console.log("!!! running effect");
    setIsSSR(false);
  }, []);
  return isSSR;
};
